/* PhysioCare — Stateless session summaries using the existing OpenRouter contract. */
const SITE_ORIGIN = 'https://physio-care.pages.dev';
const PROVIDER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-v4.1-flash';
const REPORT_PATH = '/api/v1/report/session';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Read a bounded JSON stream, including requests without a Content-Length header. */
async function readJson(message, maxBytes, invalidStatus = 400) {
  const tooLarge = () => new ApiError(invalidStatus === 400 ? 413 : 502, '資料超出允許大小。');
  if (Number(message.headers.get('content-length')) > maxBytes) throw tooLarge();
  const reader = message.body?.getReader();
  if (!reader) throw new ApiError(invalidStatus, '資料格式不正確。');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(invalidStatus, '資料格式不正確。'); }
}

/** Accept only bounded numeric metrics; never forward arbitrary text or identifiers. */
function validateMetrics(data) {
  const fields = ['total_reps', 'total_sets', 'avg_knee_angle', 'avg_torso_lean', 'form_score', 'flag_count', 'pain_score'];
  const invalid = () => { throw new ApiError(422, '訓練數據格式或數值範圍不正確。'); };
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !fields.includes(key))) invalid();
  const metrics = { ...data, flag_count: data.flag_count === undefined ? 0 : data.flag_count, pain_score: data.pain_score ?? null };
  for (const [field, max, integer] of [
    ['total_reps', 10000, true], ['total_sets', 1000, true],
    ['avg_knee_angle', 180, false], ['avg_torso_lean', 180, false],
    ['form_score', 100, true], ['flag_count', 10000, true], ['pain_score', 10, true],
  ]) {
    const value = metrics[field];
    if (field === 'pain_score' && value === null) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || (integer && !Number.isInteger(value))) invalid();
  }
  return metrics;
}

function isConfigured(env) {
  return typeof env.LLM_API_KEY === 'string' && env.LLM_API_KEY.trim().length > 0
    && typeof env.REPORT_IP_LIMITER?.limit === 'function'
    && typeof env.REPORT_GLOBAL_LIMITER?.limit === 'function';
}

/** Limit anonymous demo traffic before a request can incur provider usage. */
async function enforceLimits(request, env) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const perIp = await env.REPORT_IP_LIMITER.limit({ key: `session-report:${ip}` });
    if (!perIp.success) throw new ApiError(429, '摘要請求過於頻繁，請稍後再試。');
    const overall = await env.REPORT_GLOBAL_LIMITER.limit({ key: 'session-report' });
    if (!overall.success) throw new ApiError(429, '摘要服務忙碌，請稍後再試。');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, '摘要服務暫時無法使用，請稍後再試。');
  }
}

/** Generate an observation from numerical metrics, keeping the provider key server-side. */
async function generateSummary(metrics, env) {
  const prompt = `請用繁體中文寫一段100字以內的客觀訓練摘要，只整理以下數據，不作診斷或處方，不推斷病因或復康成效。若數據不足，直接說明。
- 總次數：${metrics.total_reps}
- 總組數：${metrics.total_sets}
- 平均膝關節角度：${metrics.avg_knee_angle.toFixed(1)}°
- 平均軀幹前傾角度：${metrics.avg_torso_lean.toFixed(1)}°
- 動作品質分數：${metrics.form_score}/100
- 觸發警報次數：${metrics.flag_count}
- 患者自述疼痛指數：${metrics.pain_score === null ? '未提供' : `${metrics.pain_score}/10`}`;
  try {
    const upstream = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_ORIGIN,
        'X-OpenRouter-Title': 'PhysioCare',
      },
      body: JSON.stringify({
        model: env.LLM_MODEL_NAME || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: '你是物理治療師的紀錄助手，只整理提供的訓練數字，不診斷、不開立治療建議。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        stream: false,
        max_tokens: 512,
        reasoning: { enabled: false },
      }),
      signal: AbortSignal.timeout(30000),
      // workerd supports manual/follow only; non-2xx responses below reject redirects.
      redirect: 'manual',
    });
    if (!upstream.ok) {
      await upstream.body?.cancel();
      const details = {
        401: '摘要服務的認證設定無效，請聯絡管理員。',
        402: '摘要服務的供應商額度不足，請聯絡管理員。',
        403: '摘要服務的供應商拒絕請求，請聯絡管理員。',
        404: '摘要服務的模型設定無效，請聯絡管理員。',
        429: '摘要服務的供應商暫時繁忙，請稍後再試。',
      };
      throw new ApiError(502, details[upstream.status] || '摘要服務未能完成生成，請稍後再試。');
    }
    const result = await readJson(upstream, 65536, 502);
    const choice = result?.choices?.[0];
    const summary = choice?.message?.content;
    if (choice?.finish_reason !== 'stop' || typeof summary !== 'string' || !summary.trim() || summary.length > 4000) {
      throw new ApiError(502, '摘要服務未能傳回完整報告，請稍後再試。');
    }
    return summary.trim();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, '無法連接摘要服務或等待逾時，請稍後再試。');
  }
}

/** Handle only API paths; the caller continues to serve website paths via ASSETS. */
export async function handleReportApi(request, env) {
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('Origin');
  const allowed = origin === SITE_ORIGIN || origin === new URL(request.url).origin;
  const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' });
  if (allowed) headers.set('Access-Control-Allow-Origin', origin);
  const json = (data, status) => Response.json(data, { status, headers });
  try {
    if (origin && !allowed) throw new ApiError(403, '不允許此網站使用報告服務。');
    if (path === '/api/health' && request.method === 'GET') {
      if (!isConfigured(env)) throw new ApiError(503, '摘要服務尚未完成設定。');
      return json({ status: 'ok', service: 'session-report' }, 200);
    }
    if (path !== REPORT_PATH) throw new ApiError(404, '找不到此API。');
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '600');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') {
      headers.set('Allow', 'POST, OPTIONS');
      throw new ApiError(405, '此API只接受POST請求。');
    }
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      throw new ApiError(415, '請以JSON格式傳送訓練數據。');
    }
    const metrics = validateMetrics(await readJson(request, 2048));
    if (!isConfigured(env)) throw new ApiError(503, '摘要服務尚未完成設定，請聯絡管理員。');
    await enforceLimits(request, env);
    return json({ summary: await generateSummary(metrics, env) }, 200);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    if (status === 429) headers.set('Retry-After', '60');
    return json({ detail: error instanceof ApiError ? error.message : '摘要服務暫時無法使用，請稍後再試。' }, status);
  }
}

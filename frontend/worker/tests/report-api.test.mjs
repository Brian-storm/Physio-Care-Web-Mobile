/* PhysioCare — Report API contract, privacy, limits and provider failure tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

const ORIGIN = 'https://physio-care.pages.dev';
const URL = 'https://report.example.test/api/v1/report/session';
const METRICS = { total_reps: 8, total_sets: 2, avg_knee_angle: 90, avg_torso_lean: 30, form_score: 85, flag_count: 0, pain_score: 2 };
const COMPLETION = { id: 'synthetic', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '完成兩組共八次深蹲，動作品質85分，疼痛指數2分。' } }] };

function environment(overrides = {}) {
  return {
    LLM_API_KEY: 'synthetic-server-only-key',
    REPORT_IP_LIMITER: { limit: async () => ({ success: true }) },
    REPORT_GLOBAL_LIMITER: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('static asset', { status: 200 }) },
    ...overrides,
  };
}

function reportRequest(body = METRICS, headers = {}) {
  return new Request(URL, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body: JSON.stringify(body) });
}

function provider(t, response = COMPLETION, status = 200) {
  return t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer synthetic-server-only-key');
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, 'deepseek/deepseek-v4.1-flash');
    assert.ok(payload.max_tokens > 0 && payload.max_tokens <= 512);
    assert.equal(payload.stream, false);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(response, { status });
  });
}

test('report returns the provider summary, with CORS and no caching', async (t) => {
  const upstream = provider(t);
  const response = await worker.fetch(reportRequest(), environment());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { summary: COMPLETION.choices[0].message.content });
  assert.equal(upstream.mock.callCount(), 1);
  const submitted = JSON.parse(upstream.mock.calls[0].arguments[1].body);
  assert.match(submitted.messages[1].content, /8/);
  assert.match(submitted.messages[1].content, /90\.0/);
  assert.match(submitted.messages[1].content, /85/);
});

test('CORS preflight permits the frontend JSON POST without invoking inference', async (t) => {
  const upstream = provider(t);
  const response = await worker.fetch(new Request(URL, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }), environment());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  assert.match(response.headers.get('access-control-allow-headers'), /Content-Type/i);
  assert.equal(upstream.mock.callCount(), 0);
});

test('other browser origins and unsupported methods cannot invoke inference', async (t) => {
  const upstream = provider(t);
  const denied = await worker.fetch(reportRequest(METRICS, { Origin: 'https://unrelated.example' }), environment());
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const wrongMethod = await worker.fetch(new Request(URL, { headers: { Origin: ORIGIN } }), environment());
  assert.equal(wrongMethod.status, 405);
  assert.match(wrongMethod.headers.get('allow'), /POST/);
  assert.equal(upstream.mock.callCount(), 0);
});

test('invalid metrics or extra fields are rejected before reaching the provider', async (t) => {
  const upstream = provider(t);
  for (const body of [null, [], {}, { ...METRICS, total_reps: -1 }, { ...METRICS, total_sets: 1.5 }, { ...METRICS, total_reps: '8' }, { ...METRICS, total_reps: 10001 }, { ...METRICS, avg_knee_angle: 181 }, { ...METRICS, avg_torso_lean: null }, { ...METRICS, form_score: 101 }, { ...METRICS, pain_score: 11 }, { ...METRICS, flag_count: -1 }, { ...METRICS, patient_name: 'Not allowed' }]) {
    const response = await worker.fetch(reportRequest(body), environment());
    assert.equal(response.status, 422, JSON.stringify(body));
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test('omitted pain score stays unprovided, rather than becoming an invented score', async (t) => {
  const upstream = provider(t);
  const { pain_score, flag_count, ...body } = METRICS;
  const response = await worker.fetch(reportRequest(body), environment());
  assert.equal(response.status, 200);
  assert.match(JSON.parse(upstream.mock.calls[0].arguments[1].body).messages[1].content, /未提供/);
});

test('an explicit null alert count is invalid rather than becoming zero', async (t) => {
  const upstream = provider(t);
  const response = await worker.fetch(reportRequest({ ...METRICS, flag_count: null }), environment());
  assert.equal(response.status, 422);
  assert.equal(upstream.mock.callCount(), 0);
});

test('malformed JSON and wrong media types are rejected', async (t) => {
  const upstream = provider(t);
  const invalid = new Request(URL, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await worker.fetch(invalid, environment())).status, 400);
  assert.equal((await worker.fetch(reportRequest(METRICS, { 'Content-Type': 'text/plain' }), environment())).status, 415);
  assert.equal(upstream.mock.callCount(), 0);
});

test('oversized bodies are refused even without Content-Length', async (t) => {
  const upstream = provider(t);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(' '.repeat(2049))); controller.close(); } });
  const request = new Request(URL, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: stream, duplex: 'half' });
  assert.equal((await worker.fetch(request, environment())).status, 413);
  assert.equal((await worker.fetch(reportRequest(METRICS, { 'Content-Length': '2049' }), environment())).status, 413);
  assert.equal(upstream.mock.callCount(), 0);
});

test('both rate limits and missing limiter bindings prevent inference', async (t) => {
  const upstream = provider(t);
  for (const binding of ['REPORT_IP_LIMITER', 'REPORT_GLOBAL_LIMITER']) {
    const response = await worker.fetch(reportRequest(), environment({ [binding]: { limit: async () => ({ success: false }) } }));
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '60');
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.equal((await worker.fetch(reportRequest(), environment({ [binding]: undefined }))).status, 503);
    assert.equal((await worker.fetch(reportRequest(), environment({ [binding]: { limit: async () => { throw new Error('private limiter failure'); } } }))).status, 503);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test('missing provider key is a sanitized unavailable response', async (t) => {
  const upstream = provider(t);
  const response = await worker.fetch(reportRequest(), environment({ LLM_API_KEY: '' }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(upstream.mock.callCount(), 0);
  assert.equal(typeof (await response.json()).detail, 'string');
});

for (const status of [401, 402, 403, 404, 429, 500, 502]) {
  test(`provider HTTP ${status} returns a safe CORS error`, async (t) => {
    provider(t, { error: { message: 'private-upstream-detail synthetic-server-only-key' } }, status);
    const response = await worker.fetch(reportRequest(), environment());
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const detail = (await response.json()).detail;
    assert.equal(typeof detail, 'string');
    assert.doesNotMatch(detail, /private-upstream-detail|synthetic-server-only-key/);
  });
}

test('network and timeout failures retain CORS without exposing details', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private network detail'); });
  const response = await worker.fetch(reportRequest(), environment());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.doesNotMatch(await response.text(), /private network detail/);
});

test('empty, malformed, or truncated completions never become successful reports', async (t) => {
  const upstream = provider(t);
  for (const body of [{}, { choices: [] }, { choices: [{ finish_reason: 'stop', message: { content: '  ' } }] }, { choices: [{ finish_reason: 'length', message: { content: 'unfinished' } }] }]) {
    upstream.mock.mockImplementation(async () => Response.json(body));
    assert.equal((await worker.fetch(reportRequest(), environment())).status, 502);
  }
});

test('health reports readiness without secrets, and other API paths remain JSON 404', async () => {
  const request = new Request('https://report.example.test/api/health', { headers: { Origin: ORIGIN } });
  const ready = await worker.fetch(request, environment());
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { status: 'ok', service: 'session-report' });
  assert.equal((await worker.fetch(request, environment({ LLM_API_KEY: '' }))).status, 503);
  assert.equal((await worker.fetch(new Request('https://report.example.test/api/missing'), environment())).status, 404);
});

test('static requests retain the ASSETS response unchanged', async () => {
  const asset = new Response('asset content', { status: 404, headers: { 'Cross-Origin-Opener-Policy': 'same-origin' } });
  const response = await worker.fetch(new Request('https://report.example.test/missing-page'), environment({ ASSETS: { fetch: async () => asset } }));
  assert.equal(response, asset);
});

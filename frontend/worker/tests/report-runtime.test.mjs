/* PhysioCare — Exercise provider requests in the actual Workers runtime. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const config = JSON.parse(readFileSync(new URL('../../wrangler.worker.jsonc', import.meta.url), 'utf8'));
const metrics = { total_reps: 12, total_sets: 1, avg_knee_angle: 90, avg_torso_lean: 30, form_score: 85, flag_count: 0, pain_score: 2 };
const origin = 'https://physio-care.pages.dev';

test('Workers runtime reaches the provider and rejects redirects without forwarding the key', async () => {
  let redirectProvider = false;
  const requestedUrls = [];
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: ['index.js', 'report-api.mjs'].map((name) => ({
      type: 'ESModule',
      path: fileURLToPath(new URL(`../${name}`, import.meta.url)),
      contents: readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'),
    })),
    compatibilityDate: config.compatibility_date,
    bindings: { LLM_API_KEY: 'synthetic-runtime-key' },
    ratelimits: Object.fromEntries(config.ratelimits.map(({ name, ...settings }) => [name, settings])),
    // Only the external provider is replaced; fetch validation and bindings run in workerd.
    outboundService: async (request) => {
      requestedUrls.push(request.url);
      assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
      assert.equal(request.headers.get('Authorization'), 'Bearer synthetic-runtime-key');
      if (redirectProvider) {
        return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example.test/' } });
      }
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '合成數據摘要。' } }] });
    },
  }));
  try {
    const send = () => mf.dispatchFetch('https://report.example.test/api/v1/report/session', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
      body: JSON.stringify(metrics),
    });
    const response = await send();
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.summary, '合成數據摘要。');
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(requestedUrls.length, 1);

    redirectProvider = true;
    const redirected = await send();
    assert.equal(redirected.status, 502);
    assert.equal(redirected.headers.get('access-control-allow-origin'), origin);
    assert.equal(requestedUrls.length, 2, 'Only the fixed provider URL is fetched; its redirect is never followed.');
  } finally {
    await mf.dispose();
  }
});

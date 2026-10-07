/* PhysioCare — Verify the public gateway preserves HTTP semantics and fails closed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/_worker.js', import.meta.url), 'utf8');
const { default: gateway } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('preserves request URL, method, body and headers through fixed binding', async () => {
  const request = new Request('https://physio-care.pages.dev/example?q=1', {
    method: 'POST', body: 'payload', headers: { 'Content-Type': 'text/plain' },
  });
  const response = await gateway.fetch(request, { PHYSIOCARE: { fetch: async (forwarded) => {
    assert.equal(forwarded, request);
    assert.equal(await forwarded.text(), 'payload');
    return new Response('created', { status: 201, headers: { 'X-Test': 'preserved' } });
  } } });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('X-Test'), 'preserved');
  assert.equal(await response.text(), 'created');
});

test('preserves binary bodies, caching and cross-origin isolation headers', async () => {
  const bytes = new Uint8Array([0, 97, 115, 109, 255]);
  const response = await gateway.fetch(new Request('https://physio-care.pages.dev/wasm/test.wasm'), {
    PHYSIOCARE: { fetch: async () => new Response(bytes, { headers: {
      'Content-Type': 'application/wasm', 'Cache-Control': 'public, max-age=60',
      'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
    } }) },
  });
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.equal(response.headers.get('Content-Type'), 'application/wasm');
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(response.headers.get('Cross-Origin-Embedder-Policy'), 'require-corp');
});

test('preserves 404 and bodyless HEAD responses', async () => {
  for (const status of [200, 404]) {
    const response = await gateway.fetch(new Request('https://physio-care.pages.dev/missing', { method: 'HEAD' }), {
      PHYSIOCARE: { fetch: async () => new Response(null, { status }) },
    });
    assert.equal(response.status, status);
    assert.equal(response.body, null);
  }
});

test('returns an uncacheable 503 without exposing binding errors or static fallback', async () => {
  const response = await gateway.fetch(new Request('https://physio-care.pages.dev/'), {
    PHYSIOCARE: { fetch: async () => { throw new Error('internal binding details'); } },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(await response.text(), /internal binding/);
});

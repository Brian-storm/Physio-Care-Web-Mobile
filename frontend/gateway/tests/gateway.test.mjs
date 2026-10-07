/* PhysioCare — Verify cross-account static proxy boundaries and HTTP semantics. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/_worker.js', import.meta.url), 'utf8');
const { default: gateway } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const env = { PHYSIOCARE_ORIGIN: 'https://demo.example.workers.dev' };
const request = (path = '/', init) => new Request(`https://physio-care.pages.dev${path}`, init);

test('fixes upstream origin while preserving path/query and stripping credentials', async (t) => {
  let forwarded;
  t.mock.method(globalThis, 'fetch', async (req) => { forwarded = req; return new Response('ok'); });
  const response = await gateway.fetch(request('//evil.example/file?url=https://evil.example', { headers: {
    Cookie: 'private=1', Authorization: 'Bearer private', Host: 'evil.example',
    'X-Forwarded-Host': 'evil.example', Accept: 'text/html', Range: 'bytes=0-9',
  } }), env);
  assert.equal(response.status, 200);
  assert.equal(new URL(forwarded.url).origin, env.PHYSIOCARE_ORIGIN);
  assert.equal(new URL(forwarded.url).pathname, '//evil.example/file');
  assert.equal(new URL(forwarded.url).search, '?url=https://evil.example');
  for (const key of ['cookie', 'authorization', 'host', 'x-forwarded-host']) assert.equal(forwarded.headers.get(key), null);
  assert.equal(forwarded.headers.get('range'), 'bytes=0-9');
  assert.equal(forwarded.redirect, 'manual');
});

test('streams binary responses with caching and isolation headers; removes cookies', async (t) => {
  const bytes = new Uint8Array([0, 97, 115, 109, 255]);
  t.mock.method(globalThis, 'fetch', async () => new Response(bytes, { headers: {
    'Content-Type': 'application/wasm', 'Cache-Control': 'public, max-age=60',
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
    'Set-Cookie': 'upstream=1',
  } }));
  const response = await gateway.fetch(request('/wasm/test.wasm'), env);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.equal(response.headers.get('Content-Type'), 'application/wasm');
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(response.headers.get('Cross-Origin-Embedder-Policy'), 'require-corp');
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.equal(response.headers.get('X-PhysioCare-Gateway'), 'worker-http-v2');
});

test('preserves HEAD and 304/404 statuses', async (t) => {
  for (const status of [200, 304, 404]) {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
    const response = await gateway.fetch(request('/missing', { method: 'HEAD' }), env);
    assert.equal(response.status, status);
    assert.equal(response.body, null);
  }
});

test('rejects mutations without contacting upstream', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('unexpected'));
  const response = await gateway.fetch(request('/', { method: 'POST', body: 'private' }), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
  assert.equal(mock.mock.callCount(), 0);
});

test('rewrites same-origin redirects to public origin without following them', async (t) => {
  for (const location of ['/patient?x=1', `${env.PHYSIOCARE_ORIGIN}/patient?x=1`]) {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 308, headers: { Location: location } }));
    const response = await gateway.fetch(request('/'), env);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('Location'), 'https://physio-care.pages.dev/patient?x=1');
  }
});

test('blocks external redirect destinations', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 302, headers: { Location: 'https://evil.example/' } }));
  const response = await gateway.fetch(request('/'), env);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Location'), null);
});

test('fails closed for missing or invalid owner origin and network failures', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('private details'); });
  for (const origin of [undefined, 'http://demo.example.workers.dev', 'https://evil.example', 'https://a:b@demo.example.workers.dev', `${env.PHYSIOCARE_ORIGIN}/path`]) {
    const response = await gateway.fetch(request('/'), { PHYSIOCARE_ORIGIN: origin });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(mock.mock.callCount(), 0);
  const response = await gateway.fetch(request('/'), env);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private details/);
});

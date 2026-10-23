/* PhysioCare — Exercise the actual pinned Wrangler preflight, with synthetic API responses. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { patchWrangler } from '../scoped-wrangler.mjs';

const require = createRequire(import.meta.url);
const original = readFileSync(require.resolve('wrangler'), 'utf8');
const patched = patchWrangler(original, '4.148.0');
const denied = () => Object.assign(new Error('Synthetic forbidden'), { status: 403, code: 10000 });

function extractFunction(source, name, next) {
  const start = source.indexOf(`async function ${name}(`);
  const end = source.indexOf(next, start);
  assert.ok(start >= 0 && end > start, 'Pinned function boundaries exist');
  return source.slice(start, end);
}

function metadataReader(source, failures = {}) {
  const requests = [];
  const warnings = [];
  const responses = {
    bindings: [{ name: 'SYNTHETIC_SECRET', type: 'secret_text' }],
    routes: [{ pattern: 'example.test/*' }],
    domains: [{ hostname: 'example.test' }],
    subdomain: { enabled: true },
    metadata: { script: { compatibility_date: '2026-10-07' } },
    schedules: { schedules: [{ cron: '0 0 * * *' }] },
  };
  const fetch = vm.runInNewContext(
    extractFunction(source, 'fetchWorkerConfig', '\nasync function downloadWorkerConfig(') + '\nfetchWorkerConfig;',
    {
      COMPLIANCE_REGION_CONFIG_UNKNOWN: {},
      logger: { warn: (message) => warnings.push(message) },
      fetchResult: async (_config, endpoint) => {
        const kind = endpoint.includes('/domains/') ? 'domains'
          : endpoint.includes('/routes?') ? 'routes'
          : endpoint.endsWith('/bindings') ? 'bindings'
          : endpoint.endsWith('/subdomain') ? 'subdomain'
          : endpoint.endsWith('/schedules') ? 'schedules' : 'metadata';
        requests.push(kind);
        if (failures[kind]) throw failures[kind];
        return responses[kind];
      },
    }
  );
  return { fetch: (allow) => fetch('synthetic-account', 'physiocare-demo', 'production', allow), requests, warnings, responses };
}

test('unpatched Wrangler reproduces the reported dashboard failure', async () => {
  const error = denied();
  const reader = metadataReader(original, { routes: error });
  await assert.rejects(reader.fetch(true), (failure) => {
    assert.match(failure.message, /Unable to fetch bindings, routes, or services metadata from the dashboard/);
    assert.equal(failure.cause, error);
    return true;
  });
});

test('only denied routing comparisons are omitted; required metadata is preserved', async () => {
  const reader = metadataReader(patched, { routes: denied(), domains: denied() });
  const result = await reader.fetch(true);
  assert.equal(result.routes.length, 0);
  assert.equal(result.customDomains.length, 0);
  assert.equal(result.bindings, reader.responses.bindings);
  assert.equal(result.subdomainStatus, reader.responses.subdomain);
  assert.equal(result.serviceEnvMetadata, reader.responses.metadata);
  assert.equal(result.cronTriggers, reader.responses.schedules);
  assert.equal(reader.requests.length, 6);
  assert.equal(reader.warnings.length, 2);
  assert.ok(reader.warnings.every((message) => !message.includes('synthetic-account')));
});

test('successful routing reads still participate in the dashboard comparison', async () => {
  const reader = metadataReader(patched);
  const result = await reader.fetch(true);
  assert.equal(result.routes, reader.responses.routes);
  assert.equal(result.customDomains, reader.responses.domains);
  assert.equal(reader.warnings.length, 0);
});

test('routing authorization errors remain fatal unless explicitly allowed', async () => {
  for (const kind of ['routes', 'domains']) {
    const error = denied();
    for (const allow of [false, undefined]) {
      await assert.rejects(metadataReader(patched, { [kind]: error }).fetch(allow), (failure) => failure.cause === error);
    }
  }
});

test('required metadata authorization failures remain fatal', async () => {
  for (const kind of ['bindings', 'subdomain', 'metadata', 'schedules']) {
    const error = denied();
    await assert.rejects(metadataReader(patched, { [kind]: error }).fetch(true), (failure) => failure.cause === error);
  }
});

test('other routing failures remain fatal', async () => {
  for (const kind of ['routes', 'domains']) {
    for (const error of [
      Object.assign(new Error('unauthorized'), { status: 401, code: 10000 }),
      Object.assign(new Error('server error'), { status: 500, code: 10000 }),
      Object.assign(new Error('other forbidden'), { status: 403, code: 12345 }),
      new Error('network error'),
    ]) {
      await assert.rejects(metadataReader(patched, { [kind]: error }).fetch(true), (failure) => failure.cause === error);
    }
  }
});

test('preflight enables the workaround only for this Worker deploying without routes', async () => {
  const sentinel = new Error('stop after recording config arguments');
  let args;
  const preflight = vm.runInNewContext(
    extractFunction(patched, 'preUploadApiChecks', '\nvar ') + '\npreUploadApiChecks;',
    {
      verifyWorkerMatchesCITag: async () => {},
      getDeployConfirmFunction: () => async () => true,
      fetchResult: async () => ({ default_environment: { environment: 'production', script: { last_deployed_from: 'dash' } } }),
      downloadWorkerConfig: async (...values) => { args = values; throw sentinel; },
      isWorkerNotFoundError: () => false,
    }
  );
  for (const [overrides, expected] of [
    [{}, true],
    [{ name: 'another-worker' }, false],
    [{ routes: ['example.test/*'] }, false],
    [{ routes: [{ pattern: 'example.test', custom_domain: true }] }, false],
    [{ command: 'versions upload' }, false],
  ]) {
    await assert.rejects(preflight({ accountId: 'synthetic-account', name: 'physiocare-demo', command: 'deploy', entry: { file: 'worker/index.js' }, routes: [], ...overrides }, {}), (error) => error === sentinel);
    assert.equal(args[4], expected);
  }
});

test('unreviewed Wrangler version or bundle is rejected', () => {
  assert.throws(() => patchWrangler(original, '4.149.0'), /requires the reviewed Wrangler/);
  assert.throws(() => patchWrangler(original + '\n', '4.148.0'), /requires the reviewed Wrangler/);
});

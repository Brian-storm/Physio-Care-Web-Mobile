/* PhysioCare — Frontend metric preparation and report service contract. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile the dependency-free client module with the project's installed TypeScript.
const source = readFileSync(new URL('../../src/services/sessionReport.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { prepareSessionReport, requestSessionReport } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const STATS = { frameCount: 2, kneeSum: 180, torsoSum: 60, formScoreSum: 169, flagCount: 1 };
const PAYLOAD = { total_reps: 8, total_sets: 0, avg_knee_angle: 90, avg_torso_lean: 30, form_score: 85, flag_count: 1, pain_score: 2 };

test('observed frame totals become the exact report API metrics', () => {
  assert.deepEqual(prepareSessionReport(STATS, 8, 1, '2', 12), PAYLOAD);
});

test('reports cumulative repetitions and completed sets across set boundaries', () => {
  for (const [repCount, setCount, totalReps, completedSets] of [
    [0, 1, 0, 0],
    [12, 1, 12, 1],
    [1, 2, 13, 1],
    [12, 3, 36, 3],
  ]) {
    const payload = prepareSessionReport(STATS, repCount, setCount, '2', 12);
    assert.equal(payload.total_reps, totalReps);
    assert.equal(payload.total_sets, completedSets);
  }
});

test('no frames and invalid pain input cannot become invented report values', () => {
  assert.throws(() => prepareSessionReport({ ...STATS, frameCount: 0 }, 0, 1, '2', 12), /數據/);
  for (const input of ['', ' ', 'abc', '3abc', '1.5', '11', '-1']) {
    assert.throws(() => prepareSessionReport(STATS, 8, 1, input, 12), /0.*10/);
  }
  assert.equal(prepareSessionReport(STATS, 8, 1, null, 12), null);
});

test('client posts metrics to the configured API and reads its summary', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://report.example.test/api/v1/report/session');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), PAYLOAD);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ summary: ' 測試摘要 ' });
  });
  assert.equal(await requestSessionReport('https://report.example.test/', PAYLOAD), '測試摘要');
  assert.equal(upstream.mock.callCount(), 1);
});

test('client retains API errors and rejects invalid successful responses', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: '請稍後再試。' }, { status: 429 }));
  await assert.rejects(requestSessionReport('https://report.example.test', PAYLOAD), /請稍後再試/);
  upstream.mock.mockImplementation(async () => Response.json({}));
  await assert.rejects(requestSessionReport('https://report.example.test', PAYLOAD), /完整/);
});

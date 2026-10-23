/* PhysioCare — Work around dashboard metadata reads denied to Worker-scoped tokens. */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const EXPECTED_VERSION = '4.148.0';
const EXPECTED_SHA256 = '028a1b0d560594692aa44bda69079d700617164bf7d4de93a4ba3aa5b401ff1c';

/** Patch only the reviewed Wrangler bundle; fail closed when dependencies change. */
export function patchWrangler(source, version) {
  if (version !== EXPECTED_VERSION || createHash('sha256').update(source).digest('hex') !== EXPECTED_SHA256) {
    throw new Error('Scoped deployment workaround requires the reviewed Wrangler 4.148.0 bundle. Re-review before upgrading.');
  }
  const replaceOne = (before, after) => {
    if (source.split(before).length !== 2) throw new Error('Wrangler workaround target changed.');
    source = source.replace(before, after);
  };

  // https://github.com/cloudflare/workers-sdk/issues/16390
  // Empty deploy routes do not publish routes/custom domains in this Wrangler version.
  // Keep all other metadata and authorization failures fatal, including binding reads.
  replaceOne(
    'async function fetchWorkerConfig(accountId, workerName, environment) {',
    `async function fetchWorkerConfig(accountId, workerName, environment, preserveUnmanagedRoutes = false) {
  const deniedUnmanagedRouting = (kind) => (error) => {
    if (!preserveUnmanagedRoutes || error?.status !== 403 || error?.code !== 10000) throw error;
    logger.warn('PhysioCare: ' + kind + ' comparison denied (HTTP 403, code 10000). This deployment does not modify routes or custom domains.');
    return [];
  };`
  );
  for (const [endpoint, kind] of [
    ['/accounts/${accountId}/workers/services/${workerName}/environments/${environment}/routes?show_zonename=true', 'Routes'],
    ['/accounts/${accountId}/workers/domains/records?page=0&per_page=5&service=${workerName}&environment=${environment}', 'Custom domains'],
  ]) {
    const target = '`' + endpoint + '`\n    )';
    replaceOne(target, target + `.catch(deniedUnmanagedRouting('${kind}'))`);
  }
  replaceOne(
    'async function downloadWorkerConfig(workerName, environment, entrypoint, accountId) {',
    'async function downloadWorkerConfig(workerName, environment, entrypoint, accountId, preserveUnmanagedRoutes = false) {'
  );
  replaceOne(
    '} = await fetchWorkerConfig(accountId, workerName, environment);',
    '} = await fetchWorkerConfig(accountId, workerName, environment, preserveUnmanagedRoutes);'
  );
  replaceOne(
    '          props.entry.file,\n          accountId\n        );',
    '          props.entry.file,\n          accountId,\n          props.command === "deploy" && name2 === "physiocare-demo" && props.routes.length === 0\n        );'
  );
  return source;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--dry-run')) {
    throw new Error('Usage: node scripts/scoped-wrangler.mjs [--dry-run]');
  }
  const cli = require.resolve('wrangler');
  const version = JSON.parse(readFileSync(join(dirname(cli), '../package.json'), 'utf8')).version;
  const patched = patchWrangler(readFileSync(cli, 'utf8'), version);
  // A temporary sibling preserves Wrangler's package-relative module and asset paths.
  // The installed CLI stays untouched; normal completion/errors clean up the copy.
  // Forced termination may leave an unused copy in node_modules.
  const temporaryCli = join(dirname(cli), `.physiocare-${randomUUID()}.js`);
  const frontend = fileURLToPath(new URL('..', import.meta.url));
  writeFileSync(temporaryCli, patched, { mode: 0o600, flag: 'wx' });
  try {
    const result = spawnSync(process.execPath, [
      '--no-warnings', temporaryCli, 'deploy', '--config', join(frontend, 'wrangler.worker.jsonc'), ...args,
    ], { cwd: frontend, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    unlinkSync(temporaryCli);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

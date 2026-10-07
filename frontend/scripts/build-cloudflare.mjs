/* PhysioCare — Export the existing synthetic demo for Workers Static Assets. */
import './prepare-pose-assets.mjs';
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_DEMO_EXPORT: '1' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
await writeFile(new URL('../out/deployment.json', import.meta.url), JSON.stringify({
  commit: revision.status === 0 ? revision.stdout.trim() : null,
  builtAt: new Date().toISOString(),
}) + '\n');

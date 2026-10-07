/* PhysioCare — Export the existing synthetic demo for Workers Static Assets. */
import './prepare-pose-assets.mjs';
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_DEMO_EXPORT: '1' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);

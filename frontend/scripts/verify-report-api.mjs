/* PhysioCare — Verify the deployed API using numeric synthetic metrics only. */
const site = 'https://physio-care.pages.dev';

try {
  const base = new URL(process.env.REPORT_API_URL || '');
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('Configure REPORT_API_URL as the HTTPS API origin.');
  }
  // Deployment propagation can briefly differ between paths. Retry only reads/preflight.
  let ready = false;
  let readinessIssue = 'Report API is not ready.';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const health = await fetch(new URL('/api/health', base), { headers: { Origin: site }, signal: AbortSignal.timeout(15000) });
      if (health.status !== 200) throw new Error(`Report API health returned HTTP ${health.status}.`);
      const state = await health.json();
      if (state.status !== 'ok' || state.service !== 'session-report') throw new Error('Report API health response is invalid.');
      const preflight = await fetch(new URL('/api/v1/report/session', base), {
        method: 'OPTIONS',
        headers: { Origin: site, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
        signal: AbortSignal.timeout(15000),
      });
      const originAllowed = preflight.headers.get('access-control-allow-origin') === site;
      if (preflight.status !== 204 || !originAllowed) {
        throw new Error(`Report API preflight failed: HTTP ${preflight.status}, expected origin allowed: ${originAllowed}.`);
      }
      ready = true;
      break;
    } catch (error) {
      readinessIssue = error.message;
    }
    if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  if (!ready) throw new Error(readinessIssue);
  // Do not retry the inference request: each attempt can consume provider quota.
  const report = await fetch(new URL('/api/v1/report/session', base), {
    method: 'POST',
    headers: { Origin: site, 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_reps: 12, total_sets: 1, avg_knee_angle: 90, avg_torso_lean: 30, form_score: 85, flag_count: 0, pain_score: 2 }),
    signal: AbortSignal.timeout(35000),
  });
  if (report.status !== 200) throw new Error(`Synthetic report returned HTTP ${report.status}; inspect provider configuration and quota.`);
  if (report.headers.get('access-control-allow-origin') !== site || report.headers.get('cache-control') !== 'no-store') {
    throw new Error('Report API CORS or cache headers are incorrect.');
  }
  const result = await report.json();
  if (typeof result.summary !== 'string' || !result.summary.trim()) throw new Error('Synthetic report was empty.');
  console.log('Report API health, browser preflight and live synthetic inference passed.');
} catch (error) {
  // Do not print the private origin, provider output, or fetch error causes.
  console.error(error.message);
  process.exitCode = 1;
}

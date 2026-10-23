/* PhysioCare — Serve static assets and the stateless report API. */
import { handleReportApi } from './report-api.mjs';

export default {
  /** Preserve asset routing, cache and isolation headers from Workers Assets. */
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return handleReportApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

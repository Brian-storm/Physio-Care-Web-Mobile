/* PhysioCare — Serve the team's website through HTTP and Pages service binding. */
export default {
  /** Preserve asset routing, cache and isolation headers from Workers Assets. */
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};

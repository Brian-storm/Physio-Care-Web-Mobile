/* PhysioCare — Forward the fixed Pages URL to the team's isolated Worker. */
export default {
  /** Stream requests and responses through the fixed service binding. */
  async fetch(request, env) {
    try {
      const upstream = await env.PHYSIOCARE.fetch(request);
      const response = new Response(upstream.body, upstream);
      response.headers.set('X-PhysioCare-Gateway', 'worker-service-v1');
      return response;
    } catch {
      return new Response('PhysioCare is temporarily unavailable. Please try again shortly.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  },
};

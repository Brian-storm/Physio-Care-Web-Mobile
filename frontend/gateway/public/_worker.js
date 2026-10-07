/* PhysioCare — Stream the static demo from its dedicated Cloudflare account. */
const FORWARDED_HEADERS = ['accept', 'accept-encoding', 'range', 'if-range', 'if-none-match', 'if-modified-since'];

/** Return a non-cacheable failure without revealing deployment configuration. */
function unavailable(status = 503) {
  return new Response('PhysioCare is temporarily unavailable. Please try again shortly.', {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default {
  /** Forward only public static reads to the owner-configured HTTPS origin. */
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' },
      });
    }
    try {
      const target = new URL(env.PHYSIOCARE_ORIGIN);
      if (target.protocol !== 'https:' || !target.hostname.endsWith('.workers.dev') ||
          target.username || target.password || target.port || target.pathname !== '/' || target.search || target.hash) {
        return unavailable();
      }
      const upstreamOrigin = target.origin;
      const incoming = new URL(request.url);
      // Assign components, rather than resolve a user path that could replace the host.
      target.pathname = incoming.pathname;
      target.search = incoming.search;
      const headers = new Headers();
      for (const name of FORWARDED_HEADERS) {
        if (request.headers.has(name)) headers.set(name, request.headers.get(name));
      }
      const upstream = await fetch(new Request(target, {
        method: request.method, headers, redirect: 'manual', signal: AbortSignal.timeout(30000),
      }));
      const response = new Response(upstream.body, upstream);
      response.headers.delete('Set-Cookie');
      const location = response.headers.get('Location');
      if (location) {
        const redirect = new URL(location, target);
        if (redirect.origin !== upstreamOrigin || redirect.username || redirect.password) {
          if (upstream.body) await upstream.body.cancel();
          return unavailable(502);
        }
        redirect.protocol = incoming.protocol;
        redirect.host = incoming.host;
        response.headers.set('Location', redirect.href);
      }
      response.headers.set('X-PhysioCare-Gateway', 'worker-http-v2');
      return response;
    } catch {
      return unavailable();
    }
  },
};

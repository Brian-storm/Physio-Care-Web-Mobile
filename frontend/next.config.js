/* PhysioCare — Next.js config: strict mode, COOP/COEP headers for SharedArrayBuffer (MediaPipe WASM) */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.CLOUDFLARE_DEMO_EXPORT === '1' ? { output: 'export' } : {}),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

// Pages serves the equivalent headers from public/_headers.
if (process.env.CLOUDFLARE_DEMO_EXPORT === '1') delete nextConfig.headers;

module.exports = nextConfig;
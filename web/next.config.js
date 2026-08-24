/** @type {import('next').NextConfig} */

/**
 * Headers that do not vary per request. The Content-Security-Policy is *not* here — it
 * carries a per-request nonce and is set in middleware.ts.
 */
const securityHeaders = [
  // Two years, subdomains included: once a browser has seen this, it will not be talked
  // into plain HTTP for this site again.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Stops a browser from "helpfully" re-interpreting a JSON error body as HTML.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Belt and braces with the CSP's frame-ancestors, for anything that predates it.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Never leak the path of a cabinet page (which can contain an order id) to another origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig = {
  reactStrictMode: true,
  // The framework and its version are free reconnaissance; nothing needs them.
  poweredByHeader: false,
  images: {
    // Product photos are uploaded through the bot straight to Cloudinary (backend/src/services
    // /cloudinaryService.ts) — this is the one hostname product images can ever come from, so
    // it's listed explicitly rather than a wildcard. A '**' hostname would turn the Next.js
    // image optimizer into an open image-fetching proxy for any URL a caller supplies
    // (SSRF / abuse risk) for zero functional benefit.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Nothing signed-in may sit in a shared cache, and a cabinet page must not be restored
      // from the browser's back-forward cache after a logout.
      {
        source: '/kabinet/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
  async rewrites() {
    // Safety-net fallback for any /api/* path without a dedicated route handler in
    // web/app/api/**. Must honor BACKEND_URL like the explicit route handlers do —
    // hardcoding localhost here silently breaks in any non-local deployment.
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return {
      // `afterFiles` (rather than the default `beforeFiles`) so an explicit route handler
      // always wins: /api/me/* must go through the authenticating proxy, never straight
      // through to the backend without a session.
      afterFiles: [{ source: '/api/products/:path*', destination: `${backendUrl}/api/products/:path*` }],
    };
  },
};

module.exports = nextConfig;

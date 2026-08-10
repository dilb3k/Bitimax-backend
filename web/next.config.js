/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Product photos are uploaded through the bot straight to Cloudinary (backend/src/services
    // /cloudinaryService.ts) — this is the one hostname product images can ever come from, so
    // it's listed explicitly rather than a wildcard. A '**' hostname would turn the Next.js
    // image optimizer into an open image-fetching proxy for any URL a caller supplies
    // (SSRF / abuse risk) for zero functional benefit.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  async rewrites() {
    // Safety-net fallback for any /api/* path without a dedicated route handler in
    // web/app/api/**. Must honor BACKEND_URL like the explicit route handlers do —
    // hardcoding localhost here silently breaks in any non-local deployment.
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

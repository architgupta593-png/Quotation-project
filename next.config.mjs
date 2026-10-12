/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // ── Optimisations for shared hosting (Hostinger) ────────────────────────
  serverExternalPackages: ["mongoose", "bcryptjs"],

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ── Headers: security, cache immutable chunks, keep API alive ───────────
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    return [
      // Global HTTP security headers
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      // Immutable cache for hashed static chunks (JS, CSS, fonts)
      // Only applied in production — Next.js dev mode manages its own
      // caching for static files and warns when this header is overridden.
      ...(isProduction
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      // Keep API connections alive on slow shared hosting
      {
        source: "/api/:path*",
        headers: [
          { key: "Connection", value: "keep-alive" },
          { key: "Keep-Alive", value: "timeout=30" },
        ],
      },
    ];
  },
};

export default nextConfig;

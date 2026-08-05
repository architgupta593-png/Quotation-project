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

  // ── Headers: cache immutable chunks, keep API alive ─────────────────────
  async headers() {
    return [
      // Immutable cache for hashed static chunks (JS, CSS, fonts)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
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

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
  // Pre-bundle heavy dependencies so cold starts are faster
  serverExternalPackages: ["mongoose", "bcryptjs"],

  // Increase server actions timeout for slow shared hosting
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ── Custom headers — keep connections alive ─────────────────────────────
  async headers() {
    return [
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Ignore toutes les erreurs ESLint lors du build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "odds-backend-fkh4.onrender.com",
      },
    ],
  },
  reactStrictMode: true,
  compress: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://odds-backend-fkh4.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;

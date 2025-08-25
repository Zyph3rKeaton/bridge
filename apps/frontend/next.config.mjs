/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig; 
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use 'export' for static hosting (Firebase, S3, Vercel static)
  // Use 'standalone' for Docker / Node server deployment
  output: process.env.BUILD_OUTPUT === 'export' ? 'export' : 'standalone',
  eslint: { ignoreDuringBuilds: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig

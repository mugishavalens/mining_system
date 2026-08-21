/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Required for mapbox-gl to bundle correctly under Turbopack/webpack
  transpilePackages: ['mapbox-gl'],
}

export default nextConfig

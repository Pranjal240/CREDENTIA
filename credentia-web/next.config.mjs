/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode runs every effect twice in development, which doubled every request while building. Production is unaffected.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-a4d3ac5440a64a8bba8f80fc29addabe.r2.dev' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pqxlkushbmlxjnlbjtbu.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['unpdf'],
    optimizePackageImports: ['@phosphor-icons/react', 'framer-motion', 'lucide-react', 'recharts', 'gsap'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
}
export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-a4d3ac5440a64a8bba8f80fc29addabe.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'pqxlkushbmlxjnlbjtbu.supabase.co' },
    ],
  },
}

module.exports = nextConfig

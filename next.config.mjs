/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    domains: ['localhost'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://accounts.google.com https://vercel.live;",
        },
        ],
      },
    ]
  },
  experimental: {
    outputFileTracingIncludes: ['fs', 'path'],
  },
}

export default nextConfig

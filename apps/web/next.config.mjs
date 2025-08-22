/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@open-survey/database',
    '@open-survey/types',
    '@open-survey/ui',
    '@open-survey/utils',
  ],
}

export default nextConfig
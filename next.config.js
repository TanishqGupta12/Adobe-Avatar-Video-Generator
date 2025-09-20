/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.example.com'],
  },
  webpack: (config) => {
    config.externals.push({
      'canvas': 'canvas',
    });
    return config;
  },
}

module.exports = nextConfig

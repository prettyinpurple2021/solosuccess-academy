/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack alias to map @/ to ./src/
  webpack: (config) => {
    config.resolve.alias['@'] = new URL('./src', import.meta.url).pathname;
    return config;
  },
  // Allow images from external domains used in the project
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
};

export default nextConfig;

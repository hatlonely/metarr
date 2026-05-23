/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist/renderer',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

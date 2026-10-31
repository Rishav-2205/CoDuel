/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repoName = 'CoDuel';

const nextConfig = {
  output: 'export',
  // When building for GitHub Pages repository subpath:
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS ? `/${repoName}` : ''),
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS ? `/${repoName}/` : ''),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs',
  basePath: '/LottoStats-Web',
  assetPrefix: 'https://alwzsoft.github.io/LottoStats-Web/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

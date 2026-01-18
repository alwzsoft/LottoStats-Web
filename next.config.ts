/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs',
  basePath: '/LottoStats-Web',
  // assetPrefix를 basePath와 동일하게 맞추거나, 빈 값으로 두어 basePath를 따르게 합니다.
  assetPrefix: 'https://alwzsoft.github.io/LottoStats-Web/', 
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
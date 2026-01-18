/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs',
  // basePath: '/LottoStats-Web', // 로컬 테스트용으로 주석 처리
  // assetPrefix: 'https://alwzsoft.github.io/LottoStats-Web/', // 로컬 테스트용으로 주석 처리
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

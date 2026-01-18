/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs',
  basePath: '/LottoStats-Web',
  // assetPrefix를 제거하거나 아래처럼 basePath와 맞춥니다.
  assetPrefix: '/LottoStats-Web', 
  images: { unoptimized: true },
};

export default nextConfig;
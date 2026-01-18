/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs',
  // GitHub Pages 저장소 이름에 맞게 설정
  basePath: '/LottoStats-Web', 
  assetPrefix: '/LottoStats-Web/', // 이 줄을 추가하세요! (끝에 / 포함)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
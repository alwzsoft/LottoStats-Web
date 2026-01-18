/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // 정적 HTML 추출 모드
  distDir: 'docs',       // 빌드 결과물을 out 대신 docs 폴더에 생성
  basePath: '/LottoStats-Web',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
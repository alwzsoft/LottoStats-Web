import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "로또 예측",
  description: "역대 빈도 기반 로또 번호 예측",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <base href="/LottoStats-Web/" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

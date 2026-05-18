import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Serif_KR, Nanum_Pen_Script } from "next/font/google";
import "./globals.css";
import { FontSizeControl } from "@/components/font-size-control";

const gowun = Gowun_Batang({
  variable: "--font-gowun",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const nanumPen = Nanum_Pen_Script({
  variable: "--font-nanum-pen",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "가족 여행 · 어반스트림 1박2일",
  description: "2026년 5월 24-25일, 경기 광주 어반스트림에서의 가족 모임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f5efe1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${gowun.variable} ${notoSerif.variable} ${nanumPen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-serif">
        {children}
        <FontSizeControl />
      </body>
    </html>
  );
}

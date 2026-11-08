import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import {
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
  Noto_Serif_TC,
} from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/sins";
import { PersistentScene } from "@/components/scene/PersistentScene";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-noto-serif-tc",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.tagline,
};

export const viewport: Viewport = {
  themeColor: "#080708",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${cormorant.variable} ${notoSerifTC.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        {/* 整站共用的 3D 場景：換頁時不會被銷毀 */}
        <Suspense fallback={null}>
          <PersistentScene />
        </Suspense>
        <div className="pointer-events-none relative z-10">{children}</div>
      </body>
    </html>
  );
}
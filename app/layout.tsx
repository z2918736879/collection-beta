import type { Metadata, Viewport } from "next";
import { Aurora } from "@/components/Aurora";
import { Nav } from "@/components/Nav";
import { ServiceWorker } from "@/components/ServiceWorker";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collection",
  description: "卡牌、黑膠與器物的收藏目錄。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Collection",
    // 讓內容延伸到瀏海底下，狀態列文字自動反白
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  // 內容延伸至安全區，由各元件自行以 env(safe-area-inset-*) 讓位
  viewportFit: "cover",
};

/**
 * 在 React 掛載前就決定主題，避免深色使用者看到一閃而過的白畫面。
 */
const noFlash = `
(function(){
  try {
    var s = localStorage.getItem('collection-theme');
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = s || (d ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className="grain">
        <ThemeProvider>
          <ServiceWorker />
          <Aurora />
          <Nav />
          <main className="relative z-0">{children}</main>
          <footer className="shell pb-16 pt-24">
            <hr className="hairline mb-8" />
            <p className="type-eyebrow text-center">
              Collection — 本機儲存，資料不離開這台裝置
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

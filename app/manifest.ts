import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collection",
    short_name: "Collection",
    description: "卡牌、黑膠與器物的收藏目錄。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "zh-Hant",
    // 啟動畫面沿用深色語彙，與圖示同一調性
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "新增藏品", url: "/collection/new" },
      { name: "瀏覽收藏", url: "/collection" },
    ],
  };
}

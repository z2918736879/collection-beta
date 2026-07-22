"use client";

import { useEffect } from "react";

/**
 * 註冊 Service Worker 並申請持久化儲存。
 *
 * 只在 production 註冊 —— 開發時 SW 的快取會與 HMR 打架，
 * 造成改了程式卻看到舊畫面的鬼打牆。
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 註冊失敗不影響正常使用，靜默略過
      });
    }

    // 要求瀏覽器不要在空間吃緊時清掉收藏資料。
    // 使用者若已「加入主畫面」，多數瀏覽器會直接同意。
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}

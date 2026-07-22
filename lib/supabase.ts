"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 瀏覽器端的 Supabase client。
 *
 * 這裡使用的 publishable 金鑰本身不帶任何權限，會被打包進前端資源，
 * 屬於公開資訊。資料的隔離完全由 supabase/schema.sql 的 Row Level
 * Security 政策在資料庫端強制執行。
 *
 * 刻意延後到第一次真正使用時才建立 —— 若在模組載入當下就建立，
 * Next.js 預先渲染頁面時會因為讀不到環境變數而讓整個 build 崩掉，
 * 而且拋出的訊息完全看不出是哪裡沒設定。
 */

let client: SupabaseClient | null = null;

function init(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "缺少 Supabase 環境變數。本機請確認 .env.local 內有 " +
        "NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY；" +
        "Vercel 請到 Settings › Environment Variables 設定後重新部署，" +
        "並記得取消勾選 Use existing Build Cache。",
    );
  }

  client = createBrowserClient(url, key);
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = init();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const COVERS_BUCKET = "covers";

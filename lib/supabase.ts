"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 瀏覽器端的 Supabase client。
 *
 * 這裡使用的 publishable 金鑰本身不帶任何權限，會被打包進前端資源，
 * 屬於公開資訊。資料的隔離完全由 supabase/schema.sql 的 Row Level
 * Security 政策在資料庫端強制執行。
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const COVERS_BUCKET = "covers";

# Collection

卡牌、黑膠與器物的收藏目錄。資料存於 Supabase，可在任何裝置登入取用。

## 啟動

需要 Node.js 20 以上。

```bash
npm install
```

複製 `.env.example` 為 `.env.local` 並填入 Supabase 的專案網址與 publishable 金鑰。

```bash
npm run dev
```

開啟 http://localhost:3000

## 結構

```
app/
  layout.tsx                 全域外殼：主題、極光背景、導覽列
  page.tsx                   首頁 — 單一焦點置中的敘事捲軸
  globals.css                設計系統（所有視覺規範集中於此）
  collection/
    page.tsx                 總覽 — 品類切換 / 搜尋 / 排序
    new/page.tsx             新增
    [id]/page.tsx            詳情
    [id]/edit/page.tsx       編輯
components/
  Aurora.tsx                 動態漸層背景
  Marks.tsx                  象徵性幾何圖形（黑膠 / 卡牌 / 器物）
  ItemCard.tsx               網格卡片
  ItemForm.tsx               新增與編輯共用的表單
  Nav.tsx  Reveal.tsx  ThemeProvider.tsx
lib/
  types.ts                   資料模型
  schema.ts                  各品類的欄位定義（新增品類從這裡改）
  supabase.ts                Supabase client（publishable 金鑰）
  db.ts                      資料存取、封面上傳與 JSON 匯出／匯入
  useSignedUrl.ts            Storage 路徑換簽章網址
```

## 設計規範

遵循 Apple Human Interface Guidelines。所有 token 定義在 `app/globals.css`。

**色彩** — 淺色為珍珠白 `#FBFBFD`（非純白，避免螢幕刺眼）；深色為純黑 `#000`，
由三團 60 秒以上循環的極光漸層提供唯一光源。

**字體** — SF Pro → PingFang TC → Noto Sans TC。內文 17px（Apple 標準，非 16px）。
大標字距收緊至 `-0.035em`，眉標撐開至 `+0.14em` —— 這個對比是版面呼吸感的來源。

**版面** — 8pt 網格。內容最大寬 1120px。區塊垂直間距 `clamp(6rem, 14vh, 11rem)`。
文案欄寬上限 40 字元。首頁留白率 75% 以上，每個視覺焦點獨佔一屏。

**材質** — 玻璃 `.glass`：`blur(40px) saturate(180%)` + 髮絲邊 + 頂部內高光。
陽極氧化鋁 `.anodized`：低對比漸層 + SVG 噪點。全域 `.grain` 噪點消除純色的塑膠感。

**動態** — 一律使用 `cubic-bezier(0.32, 0.72, 0, 1)`，400–700ms。
捲動進場位移僅 16px，敘事重量交給透明度。已處理 `prefers-reduced-motion`。

## 手機與部署

這是一個 PWA，部署後可在手機「加入主畫面」，變成獨立 app：無網址列、可離線、
體驗接近原生 app。

部署（不需要 GitHub）：

```bash
npx vercel
```

首次執行會要求登入並回答幾個設定問題，全部用預設值即可。之後要更新線上版本：

```bash
npx vercel --prod
```

圖示由腳本產生，想換外觀改 `scripts/gen-icons.mjs` 再跑一次：

```bash
node scripts/gen-icons.mjs
```

部署到 Vercel 時，記得在專案設定加入 `.env.local` 裡的那兩個環境變數。

## 安全模型

publishable 金鑰會被打包進前端資源，屬於公開資訊 —— 這是 Supabase 的設計。
資料隔離**完全依靠** `supabase/schema.sql` 裡的 Row Level Security 政策，
由 Postgres 在每次查詢時強制加上 `auth.uid() = user_id` 條件。

前端的 `RequireAuth` 只是體驗層的導向，不是安全邊界。

**每次改動 `schema.sql` 之後，務必重跑一次未授權存取測試**：
以 publishable 金鑰直接打 `/rest/v1/items`，讀取應回傳 0 筆、寫入應被 401 拒絕。

## 擴充

**新增品類** — 在 `lib/types.ts` 的 `ItemType` 加上代號，於 `lib/schema.ts`
的 `TYPE_META` 補上欄位定義與 `TYPE_ORDER`，其餘畫面會自動跟上。

**接雲端** — `lib/db.ts` 的函式簽章即為資料層介面，換成 Supabase 時
只需替換該檔實作，UI 不受影響。

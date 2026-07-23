"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Reveal } from "@/components/Reveal";
import { useTheme } from "@/components/ThemeProvider";
import { exportJSON, importJSON, listItems } from "@/lib/db";
import { TYPE_META, TYPE_ORDER } from "@/lib/schema";
import { computeTotals, formatMoney } from "@/lib/totals";
import type { CollectibleItem } from "@/lib/types";

/** 設定列：左側說明、右側動作，以髮絲線分隔 */
function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 py-6"
      style={{ borderTop: "1px solid var(--hairline)" }}
    >
      <div className="max-w-[42ch]">
        <p className="text-[0.9375rem] font-medium tracking-[-0.015em]">
          {title}
        </p>
        <p className="type-caption mt-1">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { email, signOut } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<CollectibleItem[] | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    listItems()
      .then(setItems)
      .catch(() => setItems([]));

  useEffect(() => {
    refresh();
  }, []);

  const count = items?.length ?? null;
  const totals = useMemo(
    () => (items ? computeTotals(items, TYPE_ORDER) : []),
    [items],
  );

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    setStatus("");

    try {
      const json = await exportJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `collection-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus(`已匯出 ${count ?? 0} 件藏品。`);
    } catch {
      setStatus("匯出失敗，請再試一次。");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File) {
    setBusy(true);
    setStatus("");

    try {
      const added = await importJSON(await file.text());
      await refresh();
      setStatus(`已匯入 ${added} 件藏品。`);
    } catch {
      setStatus("匯入失敗：檔案格式無法解析。");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+clamp(4rem,10vh,7rem))]">
      <Reveal>
        <p className="type-eyebrow">Settings</p>
        <h1 className="type-title mt-2">設定</h1>
        <p className="type-body mt-3 max-w-[38ch]">
          目前共 {count ?? "—"} 件藏品，儲存於雲端，可在任何裝置登入取用。
        </p>
      </Reveal>

      <Reveal delay={100}>
        <section className="mt-[clamp(3rem,8vh,5rem)]">
          <h2 className="type-eyebrow mb-2">帳號</h2>
          <SettingRow
            title={email ?? "已登入"}
            description="收藏資料以此帳號隔離，其他人即使拿到網址也讀不到。"
          >
            <button onClick={signOut} className="btn btn-ghost">
              登出
            </button>
          </SettingRow>
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-[clamp(2.5rem,6vh,4rem)]">
          <h2 className="type-eyebrow mb-5">總花費</h2>

          {/* 每個品類獨立一張卡，幣別分列 —— 不同幣別不相加 */}
          <div className="grid gap-3 sm:grid-cols-3">
            {totals.map((t) => (
              <div
                key={t.type}
                className="glass p-5"
                style={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-float)",
                }}
              >
                <p className="type-eyebrow">{TYPE_META[t.type].en}</p>
                <p className="mt-1 text-[0.9375rem] font-medium tracking-[-0.015em]">
                  {TYPE_META[t.type].label}
                </p>

                <div className="mt-4 space-y-1.5">
                  {t.byCurrency.length === 0 ? (
                    <p className="type-caption">
                      {t.itemCount === 0 ? "尚無藏品" : "尚未記錄價格"}
                    </p>
                  ) : (
                    t.byCurrency.map((c) => (
                      <p
                        key={c.currency}
                        className="tabular text-[1.0625rem] tracking-[-0.02em]"
                      >
                        {formatMoney(c.currency, c.total)}
                      </p>
                    ))
                  )}
                </div>

                <p className="type-caption mt-3">
                  {t.itemCount} 件
                  {t.pricedCount < t.itemCount &&
                    ` · ${t.itemCount - t.pricedCount} 件未記錄`}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={200}>
        <section className="mt-[clamp(2.5rem,6vh,4rem)]">
          <h2 className="type-eyebrow mb-2">外觀</h2>
          <SettingRow
            title="主題"
            description="深色主題以純黑為底，由緩慢漂移的漸層提供光源。"
          >
            <button onClick={toggle} className="btn btn-ghost">
              {theme === "light" ? "切換為深色" : "切換為淺色"}
            </button>
          </SettingRow>
        </section>
      </Reveal>

      <Reveal delay={220}>
        <section className="mt-[clamp(2.5rem,6vh,4rem)]">
          <h2 className="type-eyebrow mb-2">備份</h2>

          <SettingRow
            title="匯出為 JSON"
            description="包含所有欄位與封面圖片，單一檔案即可完整還原。雲端雖然不會因清除瀏覽器而遺失，但誤刪無法復原，定期備份仍有價值。"
          >
            <button
              onClick={handleExport}
              disabled={busy || count === 0}
              className="btn btn-primary"
              style={{ opacity: busy || count === 0 ? 0.4 : 1 }}
            >
              匯出
            </button>
          </SettingRow>

          <SettingRow
            title="從 JSON 匯入"
            description="採合併方式：id 相同的藏品會被檔案內容覆蓋，其餘保留不動。"
          >
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn btn-ghost"
              style={{ opacity: busy ? 0.4 : 1 }}
            >
              選擇檔案
            </button>
          </SettingRow>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />

          {status && (
            <p
              className="type-caption pt-4"
              style={{ borderTop: "1px solid var(--hairline)" }}
            >
              {status}
            </p>
          )}
        </section>
      </Reveal>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useTheme } from "@/components/ThemeProvider";
import { exportJSON, importJSON, listItems } from "@/lib/db";

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
  const fileRef = useRef<HTMLInputElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    listItems()
      .then((items) => setCount(items.length))
      .catch(() => setCount(0));

  useEffect(() => {
    refresh();
  }, []);

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
    <div className="shell pb-24 pt-[calc(52px+clamp(4rem,10vh,7rem))]">
      <Reveal>
        <p className="type-eyebrow">Settings</p>
        <h1 className="type-title mt-2">設定</h1>
        <p className="type-body mt-3 max-w-[38ch]">
          目前共 {count ?? "—"} 件藏品，全部儲存在這台裝置的瀏覽器中。
        </p>
      </Reveal>

      <Reveal delay={120}>
        <section className="mt-[clamp(3rem,8vh,5rem)]">
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

      <Reveal delay={200}>
        <section className="mt-[clamp(2.5rem,6vh,4rem)]">
          <h2 className="type-eyebrow mb-2">備份</h2>

          <SettingRow
            title="匯出為 JSON"
            description="包含所有欄位與封面圖片，單一檔案即可完整還原。建議定期備份 —— 清除瀏覽器資料會一併刪掉收藏。"
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

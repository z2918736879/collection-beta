"use client";

import { useEffect, useRef } from "react";

/**
 * 破壞性操作的確認對話框。
 *
 * 防誤觸的三道設計：
 *  1. 預設焦點放在「取消」而非「刪除」—— 直接按 Enter 是安全的
 *  2. Escape 與點擊背景都可退出
 *  3. 刪除鈕與取消鈕之間留出間距，避免手指誤滑
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "確定",
  cancelLabel = "取消",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);

    // 對話框開啟時鎖住背景捲動
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] grid place-items-center px-6"
      style={{ animation: "fade-in 0.3s var(--ease-standard)" }}
    >
      {/* 背景：重度模糊讓焦點完全落在對話框上 */}
      <div
        className="absolute inset-0"
        onClick={onCancel}
        style={{
          background: "rgb(0 0 0 / 0.32)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />

      <div
        className="glass relative w-full max-w-[380px] p-7 text-center"
        style={{
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--shadow-lift)",
          background: "var(--surface-solid)",
          animation: "dialog-in 0.4s var(--ease-standard)",
        }}
      >
        <h2 className="type-heading">{title}</h2>
        {description && (
          <p className="type-caption mt-2.5 leading-relaxed">{description}</p>
        )}

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              background: destructive ? "#ff3b30" : "var(--accent)",
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
          <button ref={cancelRef} onClick={onCancel} className="btn btn-ghost">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

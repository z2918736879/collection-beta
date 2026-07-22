"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createItem, deleteItem, updateItem } from "@/lib/db";
import { CURRENCIES, TYPE_META, TYPE_ORDER } from "@/lib/schema";
import { useCoverUrl } from "@/lib/useSignedUrl";
import type {
  CollectibleItem,
  CoverChange,
  ItemDraft,
  ItemType,
} from "@/lib/types";

const EMPTY: ItemDraft = {
  type: "vinyl",
  title: "",
  subtitle: "",
  year: "",
  tags: [],
  favorite: false,
  acquiredAt: "",
  price: "",
  currency: "TWD",
  notes: "",
  fields: {},
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="type-eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export function ItemForm({ existing }: { existing?: CollectibleItem }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ItemDraft>(EMPTY);
  const [tagText, setTagText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** undefined = 封面未異動、null = 要刪除、File = 要上傳新的 */
  const [coverChange, setCoverChange] = useState<CoverChange>(undefined);

  useEffect(() => {
    if (!existing) return;
    const { id, coverPath, createdAt, updatedAt, ...rest } = existing;
    setDraft(rest);
    setTagText(rest.tags.join(", "));
  }, [existing]);

  const meta = TYPE_META[draft.type];

  // 未異動時顯示雲端既有封面，否則顯示本機新選的檔案
  const coverUrl = useCoverUrl(
    coverChange === undefined ? (existing?.coverPath ?? null) : coverChange,
  );
  const hasCover = coverChange instanceof File || (coverChange === undefined && !!existing?.coverPath);

  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));

  const canSave = useMemo(() => draft.title.trim().length > 0, [draft.title]);

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");

    const payload: ItemDraft = {
      ...draft,
      title: draft.title.trim(),
      tags: tagText
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (existing) {
        await updateItem(existing.id, payload, coverChange);
        router.push(`/collection/${existing.id}`);
      } else {
        const id = await createItem(payload, coverChange);
        router.push(`/collection/${id}`);
      }
    } catch (e) {
      // 雲端會失敗，本機資料庫不會 —— 錯誤一定要讓使用者看見
      setError(e instanceof Error ? e.message : "儲存失敗，請再試一次。");
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    try {
      await deleteItem(existing.id);
      router.push("/collection");
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗，請再試一次。");
      setConfirmDelete(false);
    }
  }

  return (
    <div className="shell pb-24 pt-[calc(52px+clamp(3rem,8vh,5rem))]">
      <p className="type-eyebrow">{existing ? "Edit" : "New"}</p>
      <h1 className="type-title mt-2">{existing ? "編輯藏品" : "新增藏品"}</h1>

      <hr className="hairline my-10" />

      <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
        {/* ---------- 左欄：封面 ---------- */}
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            className="glass block w-full overflow-hidden transition-transform duration-500 hover:-translate-y-0.5"
            style={{
              borderRadius: "var(--radius-panel)",
              aspectRatio: draft.type === "card" ? "5 / 7" : "1 / 1",
              boxShadow: "var(--shadow-float)",
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="封面"
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="grid h-full w-full place-items-center text-[0.8125rem]"
                style={{ color: "var(--ink-3)" }}
              >
                點擊上傳封面
              </span>
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCoverChange(file);
            }}
          />

          {hasCover && (
            <button
              onClick={() => setCoverChange(null)}
              className="type-caption mt-3 block w-full text-center transition-opacity hover:opacity-60"
            >
              移除封面
            </button>
          )}

          <button
            onClick={() => set("favorite", !draft.favorite)}
            className="btn btn-ghost mt-4 w-full"
          >
            {draft.favorite ? "★ 已標記為精選" : "☆ 標記為精選"}
          </button>
        </div>

        {/* ---------- 右欄：欄位 ---------- */}
        <div className="space-y-10">
          <section>
            <h2 className="type-heading mb-5">品類</h2>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_ORDER.map((t) => {
                const active = draft.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => set("type", t as ItemType)}
                    className="rounded-full px-5 py-2.5 text-[0.875rem] transition-all duration-400"
                    style={{
                      background: active ? "var(--ink)" : "var(--surface)",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      border: `1px solid ${active ? "transparent" : "var(--hairline)"}`,
                      transitionTimingFunction: "var(--ease-standard)",
                    }}
                  >
                    {TYPE_META[t].label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="type-heading mb-5">基本資料</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Row label="名稱">
                  <input
                    className="field"
                    value={draft.title}
                    placeholder={meta.titlePlaceholder}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Row>
              </div>
              <Row label={meta.subtitleLabel}>
                <input
                  className="field"
                  value={draft.subtitle}
                  placeholder={meta.subtitlePlaceholder}
                  onChange={(e) => set("subtitle", e.target.value)}
                />
              </Row>
              <Row label="年份">
                <input
                  className="field tabular"
                  value={draft.year}
                  placeholder="1959"
                  onChange={(e) => set("year", e.target.value)}
                />
              </Row>
            </div>
          </section>

          {/* 依品類展開的專屬欄位 */}
          <section>
            <h2 className="type-heading mb-5">{meta.label}規格</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {meta.fields.map((f) => (
                <Row key={f.key} label={f.label}>
                  {f.options ? (
                    <select
                      className="field"
                      value={draft.fields[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="field"
                      value={draft.fields[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setField(f.key, e.target.value)}
                    />
                  )}
                </Row>
              ))}
            </div>
          </section>

          <section>
            <h2 className="type-heading mb-5">取得紀錄</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <Row label="取得日期">
                <input
                  type="date"
                  className="field"
                  value={draft.acquiredAt}
                  onChange={(e) => set("acquiredAt", e.target.value)}
                />
              </Row>
              <Row label="價格">
                <input
                  className="field tabular"
                  value={draft.price}
                  placeholder="0"
                  inputMode="decimal"
                  onChange={(e) => set("price", e.target.value)}
                />
              </Row>
              <Row label="幣別">
                <select
                  className="field"
                  value={draft.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Row>
            </div>
          </section>

          <section>
            <h2 className="type-heading mb-5">標籤與筆記</h2>
            <div className="space-y-5">
              <Row label="標籤（以逗號分隔）">
                <input
                  className="field"
                  value={tagText}
                  placeholder="爵士, 首版, 待出售"
                  onChange={(e) => setTagText(e.target.value)}
                />
              </Row>
              <Row label="筆記">
                <textarea
                  className="field"
                  rows={5}
                  value={draft.notes}
                  placeholder="來歷、狀況細節、購入的那天…"
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Row>
            </div>
          </section>

          <hr className="hairline" />

          {error && (
            <p className="text-[0.8125rem]" style={{ color: "#ff453a" }}>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={!canSave || saving}
              className="btn btn-primary"
              style={{ opacity: canSave && !saving ? 1 : 0.4 }}
            >
              {saving ? "儲存中…" : "儲存"}
            </button>
            <button onClick={() => router.back()} className="btn btn-ghost">
              取消
            </button>

            {existing && (
              <div className="ml-auto">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="type-caption">確定刪除？</span>
                    <button
                      onClick={remove}
                      className="btn btn-ghost !h-9 !px-4"
                      style={{ color: "#ff453a" }}
                    >
                      刪除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="btn btn-ghost !h-9 !px-4"
                    >
                      保留
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="type-caption transition-opacity hover:opacity-60"
                  >
                    刪除藏品
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

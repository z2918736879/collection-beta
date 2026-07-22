"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ItemCard } from "@/components/ItemCard";
import { Reveal } from "@/components/Reveal";
import { deleteItems, listItems } from "@/lib/db";
import { TYPE_META, TYPE_ORDER } from "@/lib/schema";
import type { CollectibleItem, ItemType } from "@/lib/types";

type Filter = ItemType | "all";
type Sort = "updated" | "title" | "year";

function CollectionBody() {
  const params = useSearchParams();
  const [items, setItems] = useState<CollectibleItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [query, setQuery] = useState("");

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 首頁的品類入口帶 ?type= 進來，開啟時直接套用
  useEffect(() => {
    const t = params.get("type") as ItemType | null;
    if (t && TYPE_ORDER.includes(t)) setFilter(t);
  }, [params]);

  const refresh = useCallback(
    () => listItems().then(setItems).catch(() => setItems([])),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();

    return items
      .filter((it) => filter === "all" || it.type === filter)
      .filter((it) => {
        if (!q) return true;
        return [it.title, it.subtitle, it.year, ...it.tags, ...Object.values(it.fields)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title, "zh-Hant");
        if (sort === "year") return (b.year || "").localeCompare(a.year || "");
        return b.updatedAt - a.updatedAt;
      });
  }, [items, filter, sort, query]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: items?.length ?? 0 };
    for (const t of TYPE_ORDER) {
      base[t] = items?.filter((i) => i.type === t).length ?? 0;
    }
    return base;
  }, [items]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  // 目前畫面上（已套用篩選與搜尋）的項目是否全被選取
  const allVisibleSelected =
    visible.length > 0 && visible.every((it) => selected.has(it.id));

  function toggleAll() {
    setSelected(
      allVisibleSelected ? new Set() : new Set(visible.map((it) => it.id)),
    );
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteItems([...selected]);
      await refresh();
      exitSelectMode();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="shell pb-40 pt-[calc(var(--nav-h)+clamp(4rem,10vh,7rem))]">
      {/* 標題區：大面積左對齊留白 */}
      <Reveal>
        <p className="type-eyebrow">Archive</p>
        <h1 className="type-title mt-2">收藏</h1>
        <p className="type-body mt-3 max-w-[36ch]">
          {items === null
            ? "讀取中…"
            : `${counts.all} 件藏品。`}
        </p>
      </Reveal>

      {/* 控制列 */}
      <Reveal delay={120}>
        <div className="mt-[clamp(2.5rem,6vh,4rem)] flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...TYPE_ORDER] as Filter[]).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="rounded-full px-4 py-2 text-[0.8125rem] transition-all duration-400"
                  style={{
                    background: active ? "var(--ink)" : "var(--surface)",
                    color: active ? "var(--bg)" : "var(--ink-2)",
                    border: `1px solid ${active ? "transparent" : "var(--hairline)"}`,
                    transitionTimingFunction: "var(--ease-standard)",
                  }}
                >
                  {f === "all" ? "全部" : TYPE_META[f].label}
                  <span className="tabular ml-1.5 opacity-50">{counts[f]}</span>
                </button>
              );
            })}
          </div>

          {/* 手機：自成一列並讓搜尋框吸收剩餘寬度（min-w-0 才縮得下去）。
              桌機：靠右擠成一組，搜尋框回到固定寬。 */}
          <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋"
              className="field !h-9 min-w-0 flex-1 !rounded-full !text-[0.8125rem] sm:!w-40 sm:flex-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="field !h-9 !w-auto shrink-0 !rounded-full !text-[0.8125rem]"
            >
              <option value="updated">最近更新</option>
              <option value="title">名稱</option>
              <option value="year">年份</option>
            </select>
            {counts.all > 0 && (
              <button
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className="btn btn-ghost !h-9 shrink-0 !px-4 !text-[0.8125rem]"
              >
                {selectMode ? "完成" : "選取"}
              </button>
            )}
          </div>
        </div>
      </Reveal>

      <hr className="hairline my-8" />

      {/* 網格 */}
      {items !== null && visible.length === 0 ? (
        <Reveal>
          <div className="stage py-[clamp(5rem,14vh,9rem)]">
            <h2 className="type-heading">
              {counts.all === 0 ? "還沒有藏品。" : "沒有符合的結果。"}
            </h2>
            <p className="type-body measure">
              {counts.all === 0
                ? "從第一件開始，慢慢把整個櫃子填滿。"
                : "試著換個關鍵字，或切換品類。"}
            </p>
            {counts.all === 0 && (
              <Link href="/collection/new" className="btn btn-primary mt-2">
                新增藏品
              </Link>
            )}
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i, 8) * 45}>
              <ItemCard
                item={item}
                selectable={selectMode}
                selected={selected.has(item.id)}
                onToggle={toggle}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* 選取模式的浮動操作列 */}
      {selectMode && (
        /* 外層只負責定位，絕不參與動畫 —— 動畫一旦碰 transform，
           播完歸零就會把整條列扯離中心 */
        /* 手機：兩側內縮的全寬列，寬度由螢幕決定，內容再怎麼變都不會位移。
           桌機：置中膠囊。底部再加上 iPhone home indicator 的安全區。 */
        <div
          className="pointer-events-none fixed inset-x-4 z-50 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          style={{ bottom: "calc(1.25rem + var(--safe-bottom))" }}
        >
          <div
            className="glass pointer-events-auto flex w-full items-center justify-between gap-1.5 px-2.5 py-2.5 sm:w-auto sm:gap-2"
            style={{
              borderRadius: "var(--radius-pill)",
              boxShadow: "var(--shadow-lift)",
              animation: "bar-in 0.5s var(--ease-standard)",
            }}
          >
            {/* 固定寬度，數字增減時整條列不位移 */}
            <span className="tabular min-w-[5.5rem] whitespace-nowrap px-2 text-center text-[0.8125rem] sm:min-w-[7.5rem] sm:px-3 sm:text-[0.875rem]">
              已選取 {selected.size} 件
            </span>

            <button
              onClick={toggleAll}
              className="btn btn-ghost !h-9 min-w-[4.75rem] !px-3 !text-[0.8125rem] sm:min-w-[5.75rem]"
            >
              {allVisibleSelected ? "取消全選" : "全選"}
            </button>

            <button
              onClick={() => setConfirming(true)}
              disabled={selected.size === 0}
              className="btn !h-9 !px-3 !text-[0.8125rem] sm:!px-4"
              style={{
                background: selected.size === 0 ? "var(--surface)" : "#ff3b30",
                color: selected.size === 0 ? "var(--ink-3)" : "#fff",
                border: "1px solid transparent",
                cursor: selected.size === 0 ? "default" : "pointer",
              }}
            >
              刪除
            </button>

            <button
              onClick={exitSelectMode}
              className="btn btn-ghost !h-9 !px-3 !text-[0.8125rem] sm:!px-4"
            >
              完成
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        destructive
        title={`刪除 ${selected.size} 件藏品？`}
        description="這個動作無法復原。如果還沒備份，建議先到設定匯出一份 JSON。"
        confirmLabel={deleting ? "刪除中…" : "刪除"}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionBody />
    </Suspense>
  );
}

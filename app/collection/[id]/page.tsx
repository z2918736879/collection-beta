"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { getItem } from "@/lib/db";
import { TYPE_META } from "@/lib/schema";
import { useCoverUrl } from "@/lib/useSignedUrl";
import type { CollectibleItem } from "@/lib/types";

/** metadata 表列：左標籤右數值，以髮絲線分隔，數字等寬對齊 */
function Spec({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div
      className="flex items-baseline justify-between gap-6 py-3.5"
      style={{ borderTop: "1px solid var(--hairline)" }}
    >
      <dt className="type-caption shrink-0">{label}</dt>
      <dd className="tabular text-right text-[0.9375rem] tracking-[-0.01em]">
        {value}
      </dd>
    </div>
  );
}

export default function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<CollectibleItem | null | undefined>(undefined);
  const cover = useCoverUrl(item?.coverPath);

  useEffect(() => {
    getItem(id)
      .then((found) => setItem(found ?? null))
      .catch(() => setItem(null));
  }, [id]);

  if (item === undefined) {
    return (
      <div className="shell stage min-h-[70svh] justify-center">
        <p className="type-caption">讀取中…</p>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="shell stage min-h-[70svh] justify-center">
        <h1 className="type-title">找不到這件藏品。</h1>
        <Link href="/collection" className="btn btn-ghost mt-2">
          回到收藏
        </Link>
      </div>
    );
  }

  const meta = TYPE_META[item.type];
  const priceText =
    item.price && `${item.currency} ${Number(item.price).toLocaleString()}`;

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+clamp(2.5rem,7vh,4.5rem))]">
      <Reveal>
        <Link
          href="/collection"
          className="type-caption transition-opacity hover:opacity-60"
        >
          ← 收藏
        </Link>
      </Reveal>

      {/* ---------- 主體：大圖置中，資訊靠右 ---------- */}
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Reveal>
          <div
            className="glass overflow-hidden"
            style={{
              borderRadius: "var(--radius-panel)",
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <div
              style={{
                aspectRatio: item.type === "card" ? "5 / 7" : "1 / 1",
                background: "var(--bg-deep)",
              }}
            >
              {cover ? (
                <img
                  src={cover}
                  alt={item.title}
                  className={`h-full w-full ${item.type === "card" ? "object-contain" : "object-cover"}`}
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 42%, var(--surface-hover), transparent 60%)",
                  }}
                />
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="lg:sticky lg:top-24">
            <p className="type-eyebrow">
              {meta.en}
              {item.favorite && " · 精選"}
            </p>
            <h1 className="type-title mt-2">{item.title}</h1>
            {item.subtitle && (
              <p className="type-body mt-1.5">
                {item.subtitle}
                {item.year && ` · ${item.year}`}
              </p>
            )}

            {item.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-[0.75rem]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--hairline)",
                      color: "var(--ink-2)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 規格表 */}
            <dl className="mt-9">
              {meta.fields.map((f) => (
                <Spec key={f.key} label={f.label} value={item.fields[f.key]} />
              ))}
              <Spec label="取得日期" value={item.acquiredAt} />
              <Spec label="取得價格" value={priceText || undefined} />
            </dl>

            {item.notes && (
              <div className="mt-9">
                <p className="type-eyebrow mb-3">筆記</p>
                <p className="type-body whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}

            <div className="mt-10 flex gap-3">
              <Link
                href={`/collection/${item.id}/edit`}
                className="btn btn-ghost"
              >
                編輯
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

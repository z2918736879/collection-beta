"use client";

import Link from "next/link";
import { useCoverUrl } from "@/lib/useSignedUrl";
import { TYPE_META } from "@/lib/schema";
import type { CollectibleItem } from "@/lib/types";

/** 選取指示圈。未選取時只有一圈細邊，不干擾封面。 */
function SelectMark({ selected }: { selected: boolean }) {
  return (
    <span
      className="absolute left-3 top-3 grid h-[26px] w-[26px] place-items-center rounded-full transition-all duration-300"
      style={{
        background: selected ? "var(--accent)" : "rgb(0 0 0 / 0.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1.5px solid ${selected ? "var(--accent)" : "rgb(255 255 255 / 0.7)"}`,
        transitionTimingFunction: "var(--ease-standard)",
      }}
    >
      {selected && (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path
            d="M2.5 6.8L5.2 9.5L10.5 3.8"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function CardBody({ item }: { item: CollectibleItem }) {
  const cover = useCoverUrl(item.coverPath);
  const meta = TYPE_META[item.type];

  return (
    <>
      {/* 封面：卡牌用直幅、黑膠用正方，比例貼近實物 */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: item.type === "card" ? "5 / 7" : "1 / 1",
          background: "var(--bg-deep)",
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
            style={{ transitionTimingFunction: "var(--ease-standard)" }}
          />
        ) : (
          /* 無圖時不留空洞，用同心圓幾何暗示品類 */
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, var(--surface-hover), transparent 62%)",
            }}
          />
        )}

        {item.favorite && (
          <span
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[0.8125rem]"
            style={{
              background: "var(--surface)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--hairline)",
            }}
          >
            ★
          </span>
        )}
      </div>

      <div className="px-4 pb-4 pt-3.5 text-left">
        <p className="type-eyebrow">{meta.en}</p>
        <h3 className="mt-1.5 truncate text-[0.9375rem] font-medium tracking-[-0.015em]">
          {item.title || "未命名"}
        </h3>
        <p className="truncate text-[0.8125rem]" style={{ color: "var(--ink-2)" }}>
          {[item.subtitle, item.year].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    </>
  );
}

export function ItemCard({
  item,
  selectable = false,
  selected = false,
  onToggle,
}: {
  item: CollectibleItem;
  /** 選取模式下，點擊卡片改為切換選取而非開啟詳情 */
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const shell =
    "group glass block w-full overflow-hidden transition-all duration-500";

  const style = {
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-float)",
    transitionTimingFunction: "var(--ease-standard)",
  } as const;

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggle?.(item.id)}
        aria-pressed={selected}
        aria-label={`選取 ${item.title || "未命名"}`}
        className={shell}
        style={{
          ...style,
          // 選取時以 accent 外環標示，並輕微內縮製造「被按下」的實體感
          outline: selected ? "2px solid var(--accent)" : "none",
          outlineOffset: 2,
          transform: selected ? "scale(0.97)" : "none",
        }}
      >
        <div className="relative">
          <CardBody item={item} />
          <SelectMark selected={selected} />
        </div>
      </button>
    );
  }

  return (
    <Link
      href={`/collection/${item.id}`}
      className={`${shell} hover:-translate-y-1`}
      style={style}
    >
      <CardBody item={item} />
    </Link>
  );
}

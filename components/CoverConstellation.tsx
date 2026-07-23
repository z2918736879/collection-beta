"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listItems, signedCoverUrl } from "@/lib/db";
import type { CollectibleItem } from "@/lib/types";
import { VinylMark } from "./Marks";

/**
 * 真實收藏封面組成的星系。
 *
 * 中央一張主封面，周圍數張不同景深的封面。整體隨指針視差浮動、
 * 各自緩慢漂移，滑過會微微浮起 —— 維持「單一焦點」的克制，
 * 只是焦點換成了你自己的收藏。
 *
 * 漸進增強：未登入或沒有任何封面時，退回原本的旋轉黑膠。
 */

interface Slot {
  /** 相對舞台中心的位置，百分比 */
  x: number;
  y: number;
  scale: number;
  /** 景深：0 最前（清晰、視差最大），數字越大越後 */
  depth: number;
}

// 位置經過安排，維持疏密平衡，而非隨機散落。
// x/y 為舞台尺寸的百分比（自中心起算），數值收在讓封面身體不超出
// 舞台方框的範圍內，任何螢幕寬度都不會橫向溢出。
const SLOTS: Slot[] = [
  { x: 0, y: 0, scale: 1, depth: 0 },
  { x: -34, y: -24, scale: 0.62, depth: 2 },
  { x: 32, y: -26, scale: 0.7, depth: 1 },
  { x: 36, y: 22, scale: 0.56, depth: 2 },
  { x: -36, y: 24, scale: 0.64, depth: 1 },
  { x: -18, y: 4, scale: 0.42, depth: 3 },
  { x: 20, y: -2, scale: 0.46, depth: 3 },
];

interface Placed {
  item: CollectibleItem;
  url: string;
  slot: Slot;
}

export function CoverConstellation({
  size = 460,
  /** 傳入時直接用這些圖，不查資料庫 —— 供無登入的視覺驗證使用 */
  demo,
}: {
  size?: number;
  demo?: { url: string; type: CollectibleItem["type"]; id: string }[];
}) {
  const [placed, setPlaced] = useState<Placed[] | null>(null);
  const [failed, setFailed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // 舞台邊長。手機視窗比 size 窄時縮小，同一個數字同時決定舞台寬度與
  // 內部像素運算，維持確定性 —— 用 ResizeObserver 量測會在縮放瞬間
  // 讀到 0 或暴增值而讓版面爆開。
  const [stageSize, setStageSize] = useState(size);
  useEffect(() => {
    const compute = () => {
      const avail = document.documentElement.clientWidth - 48; // 預留 shell 內距
      setStageSize(Math.max(240, Math.min(size, avail)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [size]);

  useEffect(() => {
    let cancelled = false;

    if (demo) {
      setPlaced(
        demo.slice(0, SLOTS.length).map((d, i) => ({
          item: { id: d.id, type: d.type, title: "" } as CollectibleItem,
          url: d.url,
          slot: SLOTS[i],
        })),
      );
      return;
    }

    // session 若死在半路，supabase-js 可能卡在刷新而永不 resolve；
    // 逾時就退回黑膠，避免畫面永遠停在載入
    const timeout = setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, 6000);

    (async () => {
      try {
        const items = await listItems();
        // 精選優先，其次最近更新；只取有封面的
        const withCover = items
          .filter((it) => it.coverPath)
          .sort((a, b) => Number(b.favorite) - Number(a.favorite))
          .slice(0, SLOTS.length);

        if (withCover.length === 0) {
          if (!cancelled) setFailed(true);
          return;
        }

        const signed = await Promise.all(
          withCover.map(async (item) => ({
            item,
            url: (await signedCoverUrl(item.coverPath)) ?? "",
            slot: SLOTS[0],
          })),
        );

        const usable = signed.filter((s) => s.url);
        if (usable.length === 0) {
          if (!cancelled) setFailed(true);
          return;
        }

        // 依實際張數重新配位：張數少時也維持中央焦點
        const withSlots = usable.map((s, i) => ({ ...s, slot: SLOTS[i] }));
        if (!cancelled) {
          clearTimeout(timeout);
          setPlaced(withSlots);
        }
      } catch {
        // 未登入時 listItems 會拋錯，退回黑膠
        if (!cancelled) {
          clearTimeout(timeout);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [demo]);

  // 指針視差：把座標寫進 CSS 變數，交給 transform 處理，不逐幀 re-render
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !placed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty("--px", px.toFixed(3));
      stage.style.setProperty("--py", py.toFixed(3));
    };
    const reset = () => {
      stage.style.setProperty("--px", "0");
      stage.style.setProperty("--py", "0");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", reset);
    };
  }, [placed]);

  // 退回原本的黑膠
  if (failed) return <VinylMark size={360} />;

  // 載入中：先佔位，避免版面跳動
  if (!placed) {
    return <div style={{ width: stageSize, height: stageSize }} aria-hidden />;
  }

  return (
    <div
      ref={stageRef}
      className="relative"
      style={{
        width: stageSize,
        height: stageSize,
        ["--px" as string]: 0,
        ["--py" as string]: 0,
      }}
    >
      {placed.map(({ item, url, slot }, i) => {
        const isCard = item.type === "card";
        // 主封面基準寬約舞台的 34%
        const w = stageSize * 0.34 * slot.scale;
        // slot 的 x/y 是舞台尺寸的百分比。transform 的 translate% 以元素
        // 自身為基準，各封面大小不一會擠成一團，所以換算成像素位移。
        const ox = (stageSize * slot.x) / 100;
        const oy = (stageSize * slot.y) / 100;
        // 景深越深，視差位移越小、越模糊、越暗
        const parallax = (3 - slot.depth) * 26 + 10;
        const blur = slot.depth * 0.6;
        const dim = 1 - slot.depth * 0.12;

        return (
          <Link
            key={item.id}
            href={`/collection/${item.id}`}
            className="group absolute left-1/2 top-1/2"
            style={{
              // 外層：位置（像素，相對舞台）+ 指針視差
              transform: `translate(-50%, -50%) translate(${ox}px, ${oy}px) translate(calc(var(--px) * ${parallax}px), calc(var(--py) * ${parallax}px))`,
              zIndex: 10 - slot.depth,
              transition: "transform 0.5s var(--ease-standard)",
            }}
          >
            <div
              className="constellation-float"
              style={{
                // 內層：緩慢漂移（各自不同相位）
                animationDelay: `${i * -1.7}s`,
                animationDuration: `${9 + i * 1.3}s`,
              }}
            >
              <div
                className="glass overflow-hidden transition-all duration-500 group-hover:scale-[1.06]"
                style={{
                  width: w,
                  height: w * (isCard ? 7 / 5 : 1),
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-lift)",
                  filter: `blur(${blur}px) brightness(${dim})`,
                  opacity: dim,
                }}
              >
                <img
                  src={url}
                  alt={item.title}
                  className={`h-full w-full ${isCard ? "object-contain" : "object-cover"}`}
                  draggable={false}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

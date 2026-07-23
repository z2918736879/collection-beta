"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CoverConstellation } from "@/components/CoverConstellation";
import { Reveal } from "@/components/Reveal";

/** 占位封面，供無登入時預覽動態手感。色塊取自品牌調性。 */
const DEMO = [
  ["#b8442f", "vinyl"],
  ["#3a5a8c", "card"],
  ["#c9a24b", "card"],
  ["#4a7c59", "vinyl"],
  ["#6d5a8f", "other"],
  ["#c06a52", "card"],
  ["#2f6f7a", "vinyl"],
].map(([color, type], i) => ({
  id: `demo-${i}`,
  type: type as "card" | "vinyl" | "other",
  url:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='300' height='300' fill='${color}'/><circle cx='150' cy='150' r='60' fill='rgba(255,255,255,0.14)'/></svg>`,
    ),
}));

/**
 * 首頁 Hero 的互動原型 —— 封面星系。
 * 不掛到導覽列，僅供評估，滿意後再換到 app/page.tsx。
 */
function PrototypeBody() {
  // /prototype?demo=1 用占位色塊預覽動態，不需登入
  const isDemo = useSearchParams().get("demo") === "1";

  return (
    <section className="shell flex min-h-[100svh] flex-col items-center justify-center pt-[var(--nav-h)]">
      <Reveal className="stage">
        <p className="type-eyebrow">Prototype{isDemo && " · Demo"}</p>
        <h1 className="type-display measure">為收藏而生。</h1>
        <p className="type-body measure">
          滑動游標，封面會隨之浮動；點一張即可進入該藏品。
        </p>
      </Reveal>

      <Reveal delay={180} className="my-[clamp(2rem,6vh,4.5rem)]">
        <CoverConstellation size={460} demo={isDemo ? DEMO : undefined} />
      </Reveal>

      <Reveal delay={320} className="flex flex-wrap justify-center gap-3">
        <Link href="/collection" className="btn btn-primary">
          瀏覽收藏
        </Link>
        <Link href="/" className="btn btn-ghost">
          回到目前首頁
        </Link>
      </Reveal>
    </section>
  );
}

export default function PrototypePage() {
  return (
    <Suspense fallback={null}>
      <PrototypeBody />
    </Suspense>
  );
}

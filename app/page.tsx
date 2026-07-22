import Link from "next/link";
import { CardMark, ObjectMark, VinylMark } from "@/components/Marks";
import { Reveal } from "@/components/Reveal";
import { TYPE_META, TYPE_ORDER } from "@/lib/schema";

const MARKS = {
  card: CardMark,
  vinyl: VinylMark,
  other: ObjectMark,
} as const;

export default function Home() {
  return (
    <>
      {/* ---------- 首屏：單一焦點置中 ---------- */}
      <section className="shell flex min-h-[100svh] flex-col items-center justify-center pt-[52px]">
        <Reveal className="stage">
          <p className="type-eyebrow">Collection</p>
          <h1 className="type-display measure">為收藏而生。</h1>
          <p className="type-body measure">
            卡牌、黑膠、器物。一處安靜的目錄，記下每一件的來歷與樣貌。
          </p>
        </Reveal>

        <Reveal delay={180} className="my-[clamp(3rem,7vh,5.5rem)]">
          <VinylMark size={360} />
        </Reveal>

        <Reveal delay={320} className="flex flex-wrap justify-center gap-3">
          <Link href="/collection" className="btn btn-primary">
            瀏覽收藏
          </Link>
          <Link href="/collection/new" className="btn btn-ghost">
            新增藏品
          </Link>
        </Reveal>
      </section>

      {/* ---------- 三個品類：各自獨佔一屏，維持留白節奏 ---------- */}
      {TYPE_ORDER.map((type, i) => {
        const meta = TYPE_META[type];
        const Mark = MARKS[type];
        return (
          <section
            key={type}
            className="shell flex min-h-[88svh] flex-col items-center justify-center"
          >
            <Reveal className="stage">
              <Mark size={type === "vinyl" ? 260 : 220} />
              <p className="type-eyebrow mt-8">{meta.en}</p>
              <h2 className="type-title measure">{meta.label}</h2>
              <p className="type-body measure">{meta.tagline}</p>
              <Link
                href={`/collection?type=${type}`}
                className="mt-2 text-[0.9375rem] transition-opacity duration-300 hover:opacity-60"
                style={{ color: "var(--accent)" }}
              >
                查看 {meta.label} →
              </Link>
            </Reveal>

            {i < TYPE_ORDER.length - 1 && (
              <hr className="hairline mt-[clamp(4rem,10vh,8rem)] w-full" />
            )}
          </section>
        );
      })}

      {/* ---------- 收束 ---------- */}
      <section className="section shell">
        <Reveal className="stage">
          <h2 className="type-title measure">開始你的第一件。</h2>
          <Link href="/collection/new" className="btn btn-primary mt-4">
            新增藏品
          </Link>
        </Reveal>
      </section>
    </>
  );
}

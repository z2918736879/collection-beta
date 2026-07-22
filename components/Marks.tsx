/**
 * 象徵性幾何圖形 —— 取代照片作為視覺焦點。
 *
 * 關鍵的真實感細節：反射光是「不動的」。唱片旋轉時，溝紋跟著轉，
 * 但鏡面高光固定在光源方向上。分成兩層堆疊就能得到這個效果。
 */

export function VinylMark({ size = 340 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* 落地陰影：偏移向下，模擬上方光源 */}
      <div
        className="absolute inset-[6%] rounded-full blur-2xl"
        style={{
          background: "rgb(0 0 0 / 0.32)",
          transform: "translateY(8%) scale(0.92)",
        }}
      />

      {/* 旋轉層：碟身與溝紋 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          animation: "spin-slow 26s linear infinite",
          background: `
            radial-gradient(circle at 50% 50%, #d8d3c8 0 6.2%, transparent 6.4%),
            radial-gradient(circle at 50% 50%, #1a1a1f 0 7%, transparent 7.2%),
            radial-gradient(circle at 50% 50%, #b8442f 7.2% 21%, transparent 21.2%),
            repeating-radial-gradient(circle at 50% 50%,
              rgb(255 255 255 / 0.055) 0 1px,
              rgb(0 0 0 / 0.5) 1px 2.5px),
            radial-gradient(circle at 50% 50%, #17171b, #0a0a0d 78%, #000 100%)
          `,
          boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.9)",
        }}
      />

      {/* 靜止層：鏡面反射 —— 光源固定，不隨碟身旋轉 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full mix-blend-screen"
        style={{
          background: `conic-gradient(from 200deg at 50% 50%,
            transparent 0deg,
            rgb(255 255 255 / 0.16) 26deg,
            rgb(255 255 255 / 0.03) 52deg,
            transparent 96deg,
            transparent 190deg,
            rgb(255 255 255 / 0.11) 216deg,
            rgb(255 255 255 / 0.02) 240deg,
            transparent 286deg)`,
        }}
      />

      {/* 邊緣高光：讓圓盤的厚度被看見 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(155deg, rgb(255 255 255 / 0.22), transparent 34%)",
          maskImage: "radial-gradient(circle, transparent 96%, black 96.5%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 96%, black 96.5%)",
        }}
      />
    </div>
  );
}

export function CardMark({ size = 300 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size * 1.4, perspective: 1200 }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          transform: "rotateY(-16deg) rotateX(6deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0 anodized"
          style={{
            borderRadius: 20,
            border: "1px solid var(--hairline-strong)",
            boxShadow: "var(--shadow-lift)",
          }}
        />
        {/* 玻璃保護殼的鏡面斜帶 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 20,
            background: `linear-gradient(118deg,
              transparent 22%,
              rgb(255 255 255 / 0.34) 40%,
              rgb(255 255 255 / 0.06) 47%,
              transparent 62%)`,
          }}
        />
        {/* 內框：卡牌的圖框區 */}
        <div
          className="absolute"
          style={{
            inset: "7% 7% 22% 7%",
            borderRadius: 10,
            border: "1px solid var(--hairline)",
            background:
              "linear-gradient(200deg, rgb(120 130 160 / 0.16), transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

export function ObjectMark({ size = 300 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* 陽極氧化鋁球體：磨砂表面，高光柔而不炸 */}
      <div
        className="absolute inset-[8%] rounded-full anodized"
        style={{
          boxShadow: "var(--shadow-lift), inset 0 -20px 40px rgb(0 0 0 / 0.28)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full"
        style={{
          background: `radial-gradient(circle at 34% 26%,
            rgb(255 255 255 / 0.5) 0%,
            rgb(255 255 255 / 0.08) 18%,
            transparent 44%)`,
        }}
      />
      {/* 環繞的細環，暗示精密量測 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "1px solid var(--hairline-strong)",
          animation: "spin-slow 40s linear infinite",
          maskImage:
            "conic-gradient(from 0deg, black 0deg 70deg, transparent 70deg 180deg, black 180deg 250deg, transparent 250deg)",
          WebkitMaskImage:
            "conic-gradient(from 0deg, black 0deg 70deg, transparent 70deg 180deg, black 180deg 250deg, transparent 250deg)",
        }}
      />
    </div>
  );
}

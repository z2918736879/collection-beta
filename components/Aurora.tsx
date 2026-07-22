/**
 * 動態漸層背景。
 *
 * 三團極慢漂移的色光疊在基底之上：淺色主題下近乎無形，只提供一絲色溫；
 * 深色主題下成為畫面唯一的光源，避免純黑的死寂。
 * 週期長達 60 秒以上，讓變化慢到無法被主動察覺。
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="absolute left-1/2 top-0 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--aurora-1), transparent 66%)",
          animation: "drift-a 68s var(--ease-standard) infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-[60vmax] w-[60vmax] -translate-x-1/4 translate-y-1/4 rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, var(--aurora-2), transparent 64%)",
          animation: "drift-b 86s var(--ease-standard) infinite",
        }}
      />
      <div
        className="absolute right-0 top-1/3 h-[46vmax] w-[46vmax] translate-x-1/3 rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--aurora-3), transparent 62%)",
          animation: "drift-a 104s var(--ease-standard) infinite reverse",
        }}
      />
      {/* 底部微暗，讓內容在視覺上「落地」 */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(to top, var(--bg-deep), transparent)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}

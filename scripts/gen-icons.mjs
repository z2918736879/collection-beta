/**
 * 產生 PWA 圖示。
 *
 *   node scripts/gen-icons.mjs
 *
 * 圖示沿用首頁的黑膠幾何語彙，純以 SVG 描述後轉為 PNG，
 * 想調整外觀改這支腳本再跑一次即可，不需要另外準備素材。
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
mkdirSync(OUT, { recursive: true });

/** discScale 控制碟身佔畫布的比例；maskable 版本要縮進 80% 安全區，避免被系統裁切。 */
function svg(size, discScale) {
  const c = size / 2;
  const r = size * discScale;

  // 溝紋：由外向內遞減間距，模擬真實刻紋密度
  let grooves = "";
  for (let i = 0; i < 26; i++) {
    const gr = r * (0.42 + (i / 26) * 0.56);
    const op = 0.05 + (i % 2) * 0.03;
    grooves += `<circle cx="${c}" cy="${c}" r="${gr.toFixed(2)}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${(size * 0.0035).toFixed(2)}"/>`;
  }

  return Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="34%" r="78%">
      <stop offset="0%" stop-color="#16161c"/>
      <stop offset="62%" stop-color="#08080b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <radialGradient id="disc" cx="50%" cy="44%" r="70%">
      <stop offset="0%" stop-color="#1c1c22"/>
      <stop offset="72%" stop-color="#0d0d11"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="72%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="34%" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="58%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#disc)"/>
  ${grooves}

  <!-- 中央標籤：品牌唯一的一抹暖色 -->
  <circle cx="${c}" cy="${c}" r="${(r * 0.34).toFixed(2)}" fill="#b8442f"/>
  <circle cx="${c}" cy="${c}" r="${(r * 0.075).toFixed(2)}" fill="#050507"/>

  <!-- 鏡面反射：讓平面圖示帶上真實光澤 -->
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#sheen)"/>
</svg>`);
}

const targets = [
  { file: "icon-192.png", size: 192, scale: 0.42 },
  { file: "icon-512.png", size: 512, scale: 0.42 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.33 },
  // iOS 會自行套用圓角，圖示本身不可透明
  { file: "apple-touch-icon.png", size: 180, scale: 0.42 },
];

for (const t of targets) {
  await sharp(svg(t.size, t.scale))
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, t.file));
  console.log(`${t.file}  ${t.size}x${t.size}`);
}

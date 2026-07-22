/**
 * 產生 PWA 圖示（加到主畫面後顯示的 app 圖示）。
 *
 *   node scripts/gen-icons.mjs                    使用內建的黑膠幾何圖形
 *   node scripts/gen-icons.mjs my-cover.jpg       改用你自己的圖片
 *
 * 支援 jpg / png / webp / svg。來源圖不必是正方形，會自動置中裁切。
 *
 * 換圖之後：iOS 會把主畫面圖示快取得很死，必須先長按刪除舊書籤，
 * 再從 Safari 重新「加入主畫面」才會看到新圖。
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
mkdirSync(OUT, { recursive: true });

const source = process.argv[2] ? resolve(process.argv[2]) : null;

if (source && !existsSync(source)) {
  console.error(`找不到檔案：${source}`);
  process.exit(1);
}

/* ---------- 內建的黑膠幾何圖形 ---------- */

/** discScale 控制碟身佔畫布的比例；maskable 版本要縮進安全區，避免被系統裁切。 */
function vinylSvg(size, discScale) {
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

/* ---------- 自訂圖片 ---------- */

/** 取來源圖的主色，用來填補 maskable 版本縮排後露出的邊緣。 */
async function dominantColor(file) {
  const { dominant } = await sharp(file).stats();
  return { ...dominant, alpha: 1 };
}

/**
 * inset 為單邊縮排比例。maskable 需要 0.1（內容限縮在中央 80%），
 * 因為 Android 會把圖示裁成圓形或圓角方形，邊緣一定會被吃掉。
 */
async function renderFromImage(file, size, inset) {
  const inner = Math.round(size * (1 - inset * 2));
  const offset = Math.round((size - inner) / 2);

  const scaled = await sharp(file)
    .resize(inner, inner, { fit: "cover", position: "centre" })
    .toBuffer();

  // 一律鋪上不透明底色：iOS 的主畫面圖示不支援透明，
  // 留透明會被填成黑色或出現雜訊。
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: await dominantColor(file),
    },
  })
    .composite([{ input: scaled, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/* ---------- 輸出 ---------- */

const targets = [
  { file: "icon-192.png", size: 192, discScale: 0.42, inset: 0 },
  { file: "icon-512.png", size: 512, discScale: 0.42, inset: 0 },
  // Android 自適應圖示：內容必須留在中央 80% 的安全區內
  { file: "icon-maskable-512.png", size: 512, discScale: 0.33, inset: 0.1 },
  // iOS 會自行套用圓角，圖示本身不可透明
  { file: "apple-touch-icon.png", size: 180, discScale: 0.42, inset: 0 },
];

for (const t of targets) {
  const buffer = source
    ? await renderFromImage(source, t.size, t.inset)
    : await sharp(vinylSvg(t.size, t.discScale))
        .png({ compressionLevel: 9 })
        .toBuffer();

  await sharp(buffer).toFile(join(OUT, t.file));
  console.log(`${t.file}  ${t.size}×${t.size}`);
}

console.log(
  source
    ? `\n來源：${source}\n\n記得 commit 並部署，然後在 iPhone 上刪除舊書籤再重新加入主畫面。`
    : "\n使用內建黑膠圖形。要改用自己的圖片：node scripts/gen-icons.mjs 圖片路徑",
);

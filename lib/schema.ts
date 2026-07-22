import type { ItemType } from "./types";

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  /** 有 options 時渲染為下拉選單，否則為文字輸入 */
  options?: string[];
}

export interface TypeMeta {
  type: ItemType;
  label: string;
  en: string;
  /** 副標題在此品類下的語意，例如黑膠是「藝人」 */
  subtitleLabel: string;
  titlePlaceholder: string;
  subtitlePlaceholder: string;
  tagline: string;
  fields: FieldDef[];
}

/** Goldmine 唱片評級標準 —— 二手黑膠市場的通用語言 */
const GOLDMINE = [
  "M（全新未拆）",
  "NM（近乎全新）",
  "VG+（良好偏優）",
  "VG（良好）",
  "G（尚可）",
  "P（劣）",
];

export const TYPE_META: Record<ItemType, TypeMeta> = {
  card: {
    type: "card",
    label: "卡牌",
    en: "Cards",
    subtitleLabel: "系列",
    titlePlaceholder: "青眼白龍",
    subtitlePlaceholder: "Legend of Blue Eyes",
    tagline: "每一張，都停在被封存的那一刻。",
    fields: [
      { key: "set", label: "系列代號", placeholder: "LOB-001" },
      { key: "number", label: "卡號", placeholder: "001 / 126" },
      {
        key: "rarity",
        label: "稀有度",
        options: [
          "Common",
          "Rare",
          "Super Rare",
          "Ultra Rare",
          "Secret Rare",
          "Promo",
        ],
      },
      {
        key: "gradeCompany",
        label: "鑑定機構",
        options: ["未送鑑", "PSA", "BGS", "CGC", "SGC", "ARS"],
      },
      { key: "grade", label: "鑑定分數", placeholder: "10" },
      { key: "serial", label: "鑑定流水號", placeholder: "8942 1177" },
      {
        key: "language",
        label: "語言",
        options: ["日文", "英文", "繁體中文", "簡體中文", "韓文", "其他"],
      },
    ],
  },

  vinyl: {
    type: "vinyl",
    label: "黑膠",
    en: "Vinyl",
    subtitleLabel: "藝人",
    titlePlaceholder: "Kind of Blue",
    subtitlePlaceholder: "Miles Davis",
    tagline: "溝紋裡的時間，只有轉動時才會流出。",
    fields: [
      { key: "label", label: "廠牌", placeholder: "Columbia" },
      { key: "catalog", label: "目錄編號", placeholder: "CS 8163" },
      {
        key: "format",
        label: "規格",
        options: ["LP", "EP", "7 吋", "10 吋", "12 吋", "Box Set"],
      },
      { key: "rpm", label: "轉速", options: ["33⅓", "45", "78"] },
      { key: "pressing", label: "壓片版次", placeholder: "1959 首版" },
      { key: "country", label: "產地", placeholder: "USA" },
      { key: "mediaGrade", label: "唱片評級", options: GOLDMINE },
      { key: "sleeveGrade", label: "封套評級", options: GOLDMINE },
    ],
  },

  other: {
    type: "other",
    label: "其他",
    en: "Objects",
    subtitleLabel: "系列",
    titlePlaceholder: "藏品名稱",
    subtitlePlaceholder: "所屬系列",
    tagline: "無法歸類的，往往最值得留下。",
    fields: [
      { key: "material", label: "材質", placeholder: "陽極氧化鋁" },
      { key: "dimensions", label: "尺寸", placeholder: "120 × 80 × 12 mm" },
      { key: "origin", label: "產地", placeholder: "Japan" },
      { key: "edition", label: "版次", placeholder: "限量 500 之 128" },
    ],
  },
};

export const TYPE_ORDER: ItemType[] = ["card", "vinyl", "other"];

export const CURRENCIES = ["TWD", "JPY", "USD", "EUR", "GBP", "CNY", "KRW"];

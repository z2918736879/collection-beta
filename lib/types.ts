export type ItemType = "card" | "vinyl" | "other";

export interface CollectibleItem {
  id: string;
  type: ItemType;

  /* 共用核心欄位 */
  title: string;
  /** 卡牌為系列名、黑膠為藝人名 */
  subtitle: string;
  year: string;
  tags: string[];
  favorite: boolean;

  /* 取得紀錄 */
  acquiredAt: string;
  price: string;
  currency: string;

  notes: string;

  /** 依 type 展開的專屬欄位，key 對應 schema.ts 的 FieldDef */
  fields: Record<string, string>;

  /**
   * 封面圖在 Storage 中的路徑，格式為 <user_id>/<item_id>.<ext>。
   * 圖片本身不公開，需要時再換簽章網址讀取。
   */
  coverPath: string | null;

  createdAt: number;
  updatedAt: number;
}

/** 表單編輯中的資料。封面檔案獨立傳遞，不放在這裡。 */
export type ItemDraft = Omit<
  CollectibleItem,
  "id" | "coverPath" | "createdAt" | "updatedAt"
>;

/**
 * 封面異動的意圖：
 *   undefined —— 不動封面
 *   null      —— 刪除現有封面
 *   File      —— 上傳新檔案取代
 */
export type CoverChange = File | null | undefined;

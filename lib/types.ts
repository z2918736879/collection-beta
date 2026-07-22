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

  /** 封面圖以 Blob 存於 IndexedDB，渲染時再轉 object URL */
  cover?: Blob;

  createdAt: number;
  updatedAt: number;
}

export type ItemDraft = Omit<CollectibleItem, "id" | "createdAt" | "updatedAt">;

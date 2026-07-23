import type { CollectibleItem, ItemType } from "./types";

/** 品類的顯示順序。與 schema.ts 的 TYPE_ORDER 一致，由呼叫端傳入以維持單一來源。 */
type TypeOrder = readonly ItemType[];

/**
 * 把自由輸入的價格字串解析成數字。
 *
 * 使用者可能輸入「1,200」「$1200」「約 1200 元」「1200.50」，
 * 也可能留空或亂填。只抽取數字、逗號與小數點，其餘一律忽略；
 * 無法解析或非正數則視為未填，回傳 null 而非 0 ——
 * 這樣才能區分「這件免費/未記錄」與「有記錄且為某金額」。
 */
export function parsePrice(raw: string): number | null {
  if (!raw) return null;

  // 移除千分位逗號後，取出第一段數字（含小數與可能的負號）。
  // 一定要納入負號 —— 否則「-50」會被讀成 50 而通過正數檢查。
  const cleaned = raw.replace(/,/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export interface CurrencySum {
  currency: string;
  total: number;
  /** 有金額可計入的藏品數，不含未填價格者 */
  count: number;
}

export interface TypeTotal {
  type: ItemType;
  /** 該品類的藏品總數（含未填價格者） */
  itemCount: number;
  /** 有填價格、成功計入的藏品數 */
  pricedCount: number;
  /**
   * 依幣別分開加總。不同幣別不可相加，各自成列。
   * 依金額由大到小排序，主要幣別排在前面。
   */
  byCurrency: CurrencySum[];
}

/**
 * 每個品類獨立計算一次總花費。
 *
 * 幣別必須分開：TWD 與 JPY 相加毫無意義。所以每個品類回傳
 * 一組「幣別 → 加總」的清單，而不是單一數字。
 */
export function computeTotals(
  items: CollectibleItem[],
  typeOrder: TypeOrder,
): TypeTotal[] {
  return typeOrder.map((type) => {
    const ofType = items.filter((it) => it.type === type);

    const sums = new Map<string, { total: number; count: number }>();
    for (const item of ofType) {
      const value = parsePrice(item.price);
      if (value === null) continue;

      const currency = item.currency || "—";
      const entry = sums.get(currency) ?? { total: 0, count: 0 };
      entry.total += value;
      entry.count += 1;
      sums.set(currency, entry);
    }

    const byCurrency: CurrencySum[] = [...sums.entries()]
      .map(([currency, { total, count }]) => ({ currency, total, count }))
      .sort((a, b) => b.total - a.total);

    return {
      type,
      itemCount: ofType.length,
      pricedCount: byCurrency.reduce((n, c) => n + c.count, 0),
      byCurrency,
    };
  });
}

/** 依幣別格式化金額，整數不顯示小數、有小數才顯示。 */
export function formatMoney(currency: string, amount: number): string {
  const hasFraction = amount % 1 !== 0;
  const num = amount.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${num}`;
}

import type { CollectibleItem } from "./types";

export type SortKey = "updated" | "title" | "subtitle" | "year" | "acquired";

export const SORT_ORDER: SortKey[] = [
  "updated",
  "title",
  "subtitle",
  "year",
  "acquired",
];

/**
 * subtitle 的語意依品類而異（黑膠是藝人、卡牌是系列），
 * 所以這裡只給通用名稱，畫面上會在篩選特定品類時換成該品類的說法。
 */
export const SORT_LABELS: Record<SortKey, string> = {
  updated: "最近更新",
  title: "名稱",
  subtitle: "作者",
  year: "年份",
  acquired: "購入日期",
};

/**
 * 共用的比較器。
 *
 * numeric   —— 讓「Vol. 2」排在「Vol. 10」前面，而不是照字元逐位比
 * sensitivity: base —— 忽略大小寫與變音符號，
 *              避免「abbey road」和「Abbey Road」被拆到清單兩端
 *
 * 中文會排在英文之前，這是 zh-Hant 定序的既定行為。
 */
const collator = new Intl.Collator("zh-Hant", {
  numeric: true,
  sensitivity: "base",
});

/**
 * 空值一律排到最後。
 *
 * 若照一般字串比較，未填的欄位會是空字串而排在最前面，
 * 於是「依購入日期排序」的第一頁全是沒填日期的藏品 —— 毫無用處。
 */
function compareText(a: string, b: string, desc: boolean): number {
  const left = a?.trim() ?? "";
  const right = b?.trim() ?? "";

  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  return desc ? collator.compare(right, left) : collator.compare(left, right);
}

export function compareItems(
  a: CollectibleItem,
  b: CollectibleItem,
  sort: SortKey,
): number {
  switch (sort) {
    case "title":
      return compareText(a.title, b.title, false);

    // 同一位藝人的作品接著以名稱排序，翻閱時才不會跳來跳去
    case "subtitle":
      return (
        compareText(a.subtitle, b.subtitle, false) ||
        compareText(a.title, b.title, false)
      );

    case "year":
      return (
        compareText(a.year, b.year, true) || compareText(a.title, b.title, false)
      );

    // acquiredAt 為 YYYY-MM-DD，字串比較即等同日期比較
    case "acquired":
      return (
        compareText(a.acquiredAt, b.acquiredAt, true) ||
        compareText(a.title, b.title, false)
      );

    default:
      return b.updatedAt - a.updatedAt;
  }
}

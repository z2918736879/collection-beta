import { openDB, type IDBPDatabase } from "idb";
import type { CollectibleItem, ItemDraft } from "./types";

const DB_NAME = "collection-beta";
const STORE = "items";
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB 僅能在瀏覽器端存取");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("type", "type");
        store.createIndex("updatedAt", "updatedAt");
      },
    });
  }
  return dbPromise;
}

function newId() {
  return crypto.randomUUID();
}

export async function listItems(): Promise<CollectibleItem[]> {
  const db = await getDB();
  const all: CollectibleItem[] = await db.getAll(STORE);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getItem(id: string): Promise<CollectibleItem | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function createItem(draft: ItemDraft): Promise<string> {
  const db = await getDB();
  const now = Date.now();
  const item: CollectibleItem = {
    ...draft,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.put(STORE, item);
  return item.id;
}

export async function updateItem(
  id: string,
  patch: Partial<ItemDraft>,
): Promise<void> {
  const db = await getDB();
  const existing: CollectibleItem | undefined = await db.get(STORE, id);
  if (!existing) return;
  await db.put(STORE, { ...existing, ...patch, updatedAt: Date.now() });
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

/** 批次刪除。共用單一 transaction，確保全刪或全不刪。 */
export async function deleteItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  for (const id of ids) tx.store.delete(id);
  await tx.done;
}

/* ---------- 備份 ---------- */

/** 匯出為 JSON。Blob 封面轉為 data URL 以便單檔攜帶。 */
export async function exportJSON(): Promise<string> {
  const items = await listItems();
  const serialised = await Promise.all(
    items.map(async ({ cover, ...rest }) => ({
      ...rest,
      cover: cover ? await blobToDataURL(cover) : undefined,
    })),
  );
  return JSON.stringify(
    { version: VERSION, exportedAt: new Date().toISOString(), items: serialised },
    null,
    2,
  );
}

export async function importJSON(json: string): Promise<number> {
  const parsed = JSON.parse(json);
  const items: CollectibleItem[] = Array.isArray(parsed?.items)
    ? parsed.items
    : [];

  // 先把所有 data URL 解碼完再開 transaction。
  // IndexedDB 的 transaction 一旦讓出事件迴圈就會自動失效，
  // 中途 await fetch 會使後續的 put 拋 TransactionInactiveError。
  const prepared = await Promise.all(
    items.map(async (raw) => ({
      ...raw,
      id: raw.id ?? newId(),
      cover:
        typeof raw.cover === "string"
          ? await dataURLToBlob(raw.cover)
          : undefined,
    })),
  );

  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  for (const item of prepared) tx.store.put(item);
  await tx.done;

  return prepared.length;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const res = await fetch(dataURL);
  return res.blob();
}

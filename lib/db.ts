import { COVERS_BUCKET, supabase } from "./supabase";
import type { CollectibleItem, CoverChange, ItemDraft } from "./types";

const TABLE = "items";

/** 資料庫欄位為 snake_case，前端一律 camelCase，在這一層完成轉換。 */
interface Row {
  id: string;
  user_id: string;
  type: CollectibleItem["type"];
  title: string;
  subtitle: string;
  year: string;
  tags: string[] | null;
  favorite: boolean;
  acquired_at: string;
  price: string;
  currency: string;
  notes: string;
  fields: Record<string, string> | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
}

function toItem(row: Row): CollectibleItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    year: row.year,
    tags: row.tags ?? [],
    favorite: row.favorite,
    acquiredAt: row.acquired_at,
    price: row.price,
    currency: row.currency,
    notes: row.notes,
    fields: row.fields ?? {},
    coverPath: row.cover_path,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  };
}

function toRow(draft: Partial<ItemDraft>) {
  const row: Record<string, unknown> = {};
  if (draft.type !== undefined) row.type = draft.type;
  if (draft.title !== undefined) row.title = draft.title;
  if (draft.subtitle !== undefined) row.subtitle = draft.subtitle;
  if (draft.year !== undefined) row.year = draft.year;
  if (draft.tags !== undefined) row.tags = draft.tags;
  if (draft.favorite !== undefined) row.favorite = draft.favorite;
  if (draft.acquiredAt !== undefined) row.acquired_at = draft.acquiredAt;
  if (draft.price !== undefined) row.price = draft.price;
  if (draft.currency !== undefined) row.currency = draft.currency;
  if (draft.notes !== undefined) row.notes = draft.notes;
  if (draft.fields !== undefined) row.fields = draft.fields;
  return row;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("尚未登入");
  return data.user.id;
}

/* ---------- 讀取 ---------- */

export async function listItems(): Promise<CollectibleItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Row[]).map(toItem);
}

export async function getItem(
  id: string,
): Promise<CollectibleItem | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toItem(data as Row) : undefined;
}

/* ---------- 封面 ---------- */

/** 換一組有效期一小時的簽章網址。bucket 為私有，無法直接以路徑存取。 */
export async function signedCoverUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(COVERS_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "bin";
}

/**
 * 路徑固定為 <user_id>/<item_id>.<ext>。
 * Storage 政策以路徑第一段比對 auth.uid()，這個規則不能改。
 */
async function uploadCover(
  userId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/${itemId}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`封面上傳失敗：${error.message}`);
  return path;
}

async function removeCover(path: string | null) {
  if (!path) return;
  await supabase.storage.from(COVERS_BUCKET).remove([path]);
}

/* ---------- 寫入 ---------- */

export async function createItem(
  draft: ItemDraft,
  cover?: CoverChange,
): Promise<string> {
  const userId = await requireUserId();
  // 先產生 id，才能在單次 insert 內就把封面路徑寫進去
  const id = crypto.randomUUID();

  const coverPath = cover ? await uploadCover(userId, id, cover) : null;

  const { error } = await supabase
    .from(TABLE)
    .insert({ ...toRow(draft), id, user_id: userId, cover_path: coverPath });

  if (error) {
    // 資料列沒建成功就不該留下孤兒圖片
    await removeCover(coverPath);
    throw new Error(error.message);
  }
  return id;
}

export async function updateItem(
  id: string,
  patch: Partial<ItemDraft>,
  cover?: CoverChange,
): Promise<void> {
  const row = toRow(patch);

  if (cover !== undefined) {
    const existing = await getItem(id);
    if (cover === null) {
      await removeCover(existing?.coverPath ?? null);
      row.cover_path = null;
    } else {
      const userId = await requireUserId();
      const nextPath = await uploadCover(userId, id, cover);
      // 換了副檔名時舊檔不會被 upsert 覆蓋，要另外清掉
      if (existing?.coverPath && existing.coverPath !== nextPath) {
        await removeCover(existing.coverPath);
      }
      row.cover_path = nextPath;
    }
  }

  const { error } = await supabase.from(TABLE).update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string): Promise<void> {
  await deleteItems([id]);
}

export async function deleteItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  // 先取回封面路徑，資料列刪掉後就查不到了
  const { data } = await supabase
    .from(TABLE)
    .select("cover_path")
    .in("id", ids);

  const paths = (data ?? [])
    .map((r) => (r as { cover_path: string | null }).cover_path)
    .filter((p): p is string => !!p);

  const { error } = await supabase.from(TABLE).delete().in("id", ids);
  if (error) throw new Error(error.message);

  if (paths.length > 0) {
    await supabase.storage.from(COVERS_BUCKET).remove(paths);
  }
}

/* ---------- 備份 ---------- */

/** 匯出為 JSON。封面圖一併轉為 data URL，單一檔案即可完整還原。 */
export async function exportJSON(): Promise<string> {
  const items = await listItems();

  const serialised = await Promise.all(
    items.map(async ({ coverPath, ...rest }) => {
      let cover: string | undefined;
      if (coverPath) {
        const { data } = await supabase.storage
          .from(COVERS_BUCKET)
          .download(coverPath);
        if (data) cover = await blobToDataURL(data);
      }
      return { ...rest, cover };
    }),
  );

  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      items: serialised,
    },
    null,
    2,
  );
}

interface ExportedItem extends Partial<ItemDraft> {
  id?: string;
  /** 舊版（IndexedDB）與新版的匯出檔都用 data URL 存封面 */
  cover?: string;
}

/**
 * 從 JSON 匯入。相同 id 會被覆蓋，其餘保留。
 * 同時相容舊版 IndexedDB 匯出的檔案。
 */
export async function importJSON(json: string): Promise<number> {
  const parsed = JSON.parse(json);
  const raw: ExportedItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
  if (raw.length === 0) return 0;

  const userId = await requireUserId();
  let imported = 0;

  for (const entry of raw) {
    const id = entry.id ?? crypto.randomUUID();

    let coverPath: string | null = null;
    if (entry.cover?.startsWith("data:")) {
      const blob = await dataURLToBlob(entry.cover);
      const ext = blob.type.split("/")[1] ?? "png";
      const file = new File([blob], `${id}.${ext}`, { type: blob.type });
      coverPath = await uploadCover(userId, id, file);
    }

    const draft: Partial<ItemDraft> = {
      type: entry.type ?? "other",
      title: entry.title ?? "",
      subtitle: entry.subtitle ?? "",
      year: entry.year ?? "",
      tags: entry.tags ?? [],
      favorite: entry.favorite ?? false,
      acquiredAt: entry.acquiredAt ?? "",
      price: entry.price ?? "",
      currency: entry.currency ?? "TWD",
      notes: entry.notes ?? "",
      fields: entry.fields ?? {},
    };

    const { error } = await supabase.from(TABLE).upsert({
      ...toRow(draft),
      id,
      user_id: userId,
      cover_path: coverPath,
    });

    if (error) throw new Error(`第 ${imported + 1} 筆匯入失敗：${error.message}`);
    imported++;
  }

  return imported;
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

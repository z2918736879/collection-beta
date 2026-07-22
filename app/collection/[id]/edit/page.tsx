"use client";

import { use, useEffect, useState } from "react";
import { ItemForm } from "@/components/ItemForm";
import { getItem } from "@/lib/db";
import type { CollectibleItem } from "@/lib/types";

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<CollectibleItem | null | undefined>(undefined);

  useEffect(() => {
    getItem(id)
      .then((found) => setItem(found ?? null))
      .catch(() => setItem(null));
  }, [id]);

  if (item === undefined) {
    return (
      <div className="shell stage min-h-[70svh] justify-center">
        <p className="type-caption">讀取中…</p>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="shell stage min-h-[70svh] justify-center">
        <h1 className="type-title">找不到這件藏品。</h1>
      </div>
    );
  }

  return <ItemForm existing={item} />;
}

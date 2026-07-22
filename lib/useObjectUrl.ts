"use client";

import { useEffect, useState } from "react";

/** 將 IndexedDB 取出的 Blob 轉為可渲染的 object URL，卸載時自動釋放。 */
export function useObjectUrl(blob?: Blob | null): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return url;
}

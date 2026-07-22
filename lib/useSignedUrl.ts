"use client";

import { useEffect, useState } from "react";
import { signedCoverUrl } from "./db";

/**
 * 把 Storage 路徑換成可顯示的簽章網址。
 *
 * 也接受本機尚未上傳的 File —— 表單預覽新選的封面時會用到，
 * 這種情況改走 object URL 並在卸載時釋放。
 */
export function useCoverUrl(source: string | File | null | undefined) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!source) {
      setUrl(undefined);
      return;
    }

    if (source instanceof File) {
      const objectUrl = URL.createObjectURL(source);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    let cancelled = false;
    signedCoverUrl(source).then((signed) => {
      if (!cancelled) setUrl(signed ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return url;
}

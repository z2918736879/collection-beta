"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { VinylMark } from "@/components/Marks";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 已登入就不該停在登入頁
  useEffect(() => {
    if (!loading && session) router.replace("/collection");
  }, [loading, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // 不明說是帳號還是密碼錯，避免洩漏哪些信箱存在
      setError(
        signInError.message === "Invalid login credentials"
          ? "帳號或密碼不正確。"
          : signInError.message,
      );
      setBusy(false);
      return;
    }

    router.replace("/collection");
  }

  return (
    <div className="shell flex min-h-[100svh] flex-col items-center justify-center py-20">
      <Reveal className="stage w-full max-w-[360px]">
        <VinylMark size={132} />

        <div className="mt-4">
          <p className="type-eyebrow">Collection</p>
          <h1 className="type-heading mt-2">登入</h1>
        </div>

        <form onSubmit={submit} className="mt-2 w-full space-y-3 text-left">
          <label className="block">
            <span className="type-eyebrow mb-2 block">信箱</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </label>

          <label className="block">
            <span className="type-eyebrow mb-2 block">密碼</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </label>

          {error && (
            <p className="text-[0.8125rem]" style={{ color: "#ff453a" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full"
            style={{ opacity: busy ? 0.5 : 1 }}
          >
            {busy ? "登入中…" : "登入"}
          </button>
        </form>

        <p className="type-caption mt-2">
          此收藏庫不開放註冊，帳號由管理者建立。
        </p>
      </Reveal>
    </div>
  );
}

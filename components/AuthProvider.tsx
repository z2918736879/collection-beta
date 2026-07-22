"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  /** 首次取得 session 前為 true，用來避免畫面閃爍與誤導向 */
  loading: boolean;
  email: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  email: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 登入、登出、token 自動續期都會觸發
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        email: session?.user.email ?? null,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * 包住需要登入才能看的頁面。
 *
 * 這是體驗層的防護，不是安全邊界 —— 真正的資料隔離由資料庫的
 * Row Level Security 負責。就算有人繞過這裡，也讀不到任何資料。
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="shell stage min-h-[70svh] justify-center">
        <p className="type-caption">{loading ? "確認登入狀態…" : "前往登入…"}</p>
      </div>
    );
  }

  return <>{children}</>;
}

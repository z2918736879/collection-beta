"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * 導覽列。仿 Apple 官網的行為：置頂時完全透明融入版面，
 * 一旦捲動才浮出玻璃底與髮絲邊，避免搶走首屏的視覺焦點。
 */
export function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/collection", label: "收藏" },
    { href: "/collection/new", label: "新增" },
    { href: "/settings", label: "設定" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled ? "var(--surface)" : "transparent",
        backdropFilter: scrolled ? "blur(40px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(40px) saturate(180%)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--hairline)" : "transparent"}`,
        transition: "all 0.5s var(--ease-standard)",
      }}
    >
      <nav className="shell flex h-[52px] items-center justify-between">
        <Link
          href="/"
          className="text-[0.9375rem] font-semibold tracking-[-0.02em]"
        >
          Collection
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-300"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  background: active ? "var(--surface-hover)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={toggle}
            aria-label={theme === "light" ? "切換為深色" : "切換為淺色"}
            className="ml-1 grid h-8 w-8 place-items-center rounded-full transition-colors duration-300 hover:bg-[var(--surface-hover)]"
          >
            <span
              className="block h-3.5 w-3.5 rounded-full transition-all duration-500"
              style={{
                border: "1.5px solid var(--ink-2)",
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, var(--ink-2) 50%, transparent 50%)"
                    : "transparent",
              }}
            />
          </button>
        </div>
      </nav>
    </header>
  );
}

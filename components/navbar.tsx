"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CatMark } from "@/components/review/cat-mascot";

const navLinks = [
  { href: "/", label: "首页", section: "home" },
  { href: "/archive", label: "资料库", section: "archive" },
  { href: "/review", label: "喵评", section: "review" },
  { href: "/about", label: "关于", section: "about" },
  { href: "/contact", label: "联系", section: "contact" },
];

function currentSection(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/review")) return "review";
  if (pathname === "/about" || pathname === "/privacy" || pathname === "/terms") return "about";
  if (pathname === "/contact") return "contact";
  // 作品详情、归档、搜索都属于「资料库」模块。
  return "archive";
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const section = currentSection(pathname);

  return (
    <header className="miao-nav">
      <div className="miao-nav-inner">
        <Link href="/" className="miao-brand" >
          <CatMark className="miao-brand-mark" />
          <span className="miao-brand-text">
            <strong>旮旯喵评</strong>
            <small>GALGAME GUIDE</small>
          </span>
        </Link>

        <nav className="miao-nav-links" aria-label="主导航">
          {navLinks.map((link) => {
            const active = section === link.section;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`miao-nav-link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="miao-menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {open ? (
              <path d="M2 2L16 16M2 16L16 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M1 5H17M1 9H17M1 13H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="miao-mobile-menu">
          <nav className="miao-mobile-links" aria-label="移动端导航">
            {navLinks.map((link) => {
              const active = section === link.section;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`miao-mobile-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

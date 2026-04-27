"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminToastProvider } from "@/components/org/AdminToast";
import "@/styles/org/admin.css";

const THEME_KEY = "w3pn-admin-theme";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/events/admin", label: "Events" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/about/admin", label: "About" },
  { href: "/admin/donate", label: "Donate" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/mailing-list", label: "Mailing list" },
  { href: "/admin/logs", label: "Audit Logs" },
];

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleNavigation = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <AdminToastProvider>
      <div className="admin-shell" data-admin-theme={theme}>
        {/* Top bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-topbar-menu"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
            <Link href="/admin" className="admin-topbar-logo" onClick={handleNavigation}>
              <Image
                src="/images/site-shared/navigation/nav-logo.svg"
                alt="Web3Privacy Now"
                className="admin-topbar-logo-img"
                width={285}
                height={27}
                priority
                unoptimized
              />
            </Link>
            <span className="admin-topbar-badge">Admin</span>
          </div>
          <div className="admin-topbar-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-topbar-theme"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="admin-topbar-back admin-topbar-logout"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
                window.location.href = "/admin/login";
              }}
            >
              Log out
            </button>
            <Link href="/" className="admin-topbar-back" onClick={handleNavigation}>
              Back to Web
            </Link>
          </div>
        </header>

        <div className="admin-body">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
            <nav className="admin-sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-sidebar-link ${isActive(item.href, item.exact) ? "is-active" : ""}`}
                  onClick={handleNavigation}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="admin-main">
            {children}
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

export type SectionNavItem = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  items: SectionNavItem[];
  /** Use "dark" for org/events page with dark background */
  variant?: "default" | "dark";
};

const pillBase =
  "rounded-full border border-[#9ca3af] dark:border-[#6b7280] bg-black dark:bg-black";
const itemBase =
  "text-xs font-bold uppercase tracking-[0.12em] transition-colors";
const itemActive = "text-[#70FF88]";
const itemInactive =
  "text-[#9ca3af] dark:text-[#9ca3af] hover:text-[#d1d5db] dark:hover:text-[#d1d5db]";

function scrollToSection(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function DetailSectionNav({ items, variant = "default" }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopNavWidth = `min(100%, ${items.length * 180}px)`;

  const updateActiveFromScroll = useCallback(() => {
    const ids = items.map((i) => i.href.replace("#", ""));
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const viewportMid = scrollY + (typeof window !== "undefined" ? window.innerHeight / 3 : 0);

    for (let i = ids.length - 1; i >= 0; i--) {
      const el = document.getElementById(ids[i]);
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + scrollY;
        if (top <= viewportMid) {
          setActiveId(ids[i]);
          return;
        }
      }
    }
    setActiveId(ids[0] ?? null);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && items.some((i) => i.href === `#${id}`)) {
              setActiveId(id);
            }
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const id = item.href.replace("#", "");
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(updateActiveFromScroll);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateActiveFromScroll]);

  const handleItemClick = (item: SectionNavItem) => {
    scrollToSection(item.href);
    setMobileOpen(false);
  };

  if (!items.length) return null;

  const activeLabel = items.find((i) => i.href === `#${activeId}`)?.label ?? items[0].label;

  const navBg =
    variant === "dark"
      ? "bg-black md:bg-transparent"
      : "bg-white dark:bg-[#0c1117]";

  return (
    <nav
      className={`sticky top-0 z-30 mb-6 pt-2 pb-2 ${navBg}`}
      aria-label="Page sections"
    >
      {/* Desktop: horizontal pill – full width with even spacing */}
      <div
        className={`hidden md:flex ${pillBase} mx-auto w-full px-4 py-2.5`}
        style={{ width: desktopNavWidth }}
      >
        <ul className="flex w-full items-center justify-between gap-4">
          {items.map((item) => {
            const isActive = item.href === `#${activeId}`;
            return (
              <li key={item.id} className="min-w-0 flex-1 text-center">
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`${itemBase} ${isActive ? itemActive : itemInactive} w-full py-1`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile: dropdown */}
      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className={`flex w-full items-center justify-between ${pillBase} px-4 py-3 text-left`}
          aria-expanded={mobileOpen}
          aria-haspopup="listbox"
          aria-label={`Section: ${activeLabel}. Click to show options.`}
        >
          <span className={`${itemBase} ${itemActive}`}>{activeLabel}</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-[#9ca3af] transition-transform ${
              mobileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[12px] border border-[#9ca3af] dark:border-[#6b7280] bg-black dark:bg-black py-2 shadow-lg"
            >
              {items.map((item) => {
                const isActive = item.href === `#${activeId}`;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleItemClick(item)}
                      className={`block w-full px-4 py-2.5 text-left ${itemBase} ${
                        isActive ? itemActive : itemInactive
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}

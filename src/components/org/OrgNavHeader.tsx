/** Responsive top navigation header with "More" dropdown, animated active-link indicator, and mobile hamburger menu. */

"use client";

import Image from "next/image";
import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { passthroughImageLoader } from "@/lib/passthrough-image-loader";
import { getNavItemsForOrgWeb, isNavItemActive } from "@/lib/org/nav-utils";

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "0.25em", marginTop: "-2px" }}>
      <path d="M12 8.5V13H3V4h4.5M14 2L8 8M14 2h-4M14 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type NavItem = { label: string; href?: string; external?: boolean };
type Content = { site?: { title?: string }; nav?: { items?: NavItem[] } };

function useActiveIndicator(pathname: string) {
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const update = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>(
      ".nav-links > a.nav-item-active:not(.nav-item-overflow):not(.nav-more-mobile-item)",
    );
    if (!active || active.offsetParent === null) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const linkRect = active.getBoundingClientRect();
    setIndicator({ left: linkRect.left - navRect.left, width: linkRect.width });
  }, []);

  useLayoutEffect(update, [pathname, update]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [update]);

  return [navRef, indicator] as const;
}

const MOBILE_BP = 768;

// Labels that always live inside the "More" dropdown on desktop/tablet
const MORE_LABELS = new Set(["Docs", "DOCS", "Resources", "RESOURCES"]);

export default function OrgNavHeader({ content }: { content: Content }) {
  const site = content?.site ?? {};
  const pathname = usePathname() ?? "";
  const allItems = useMemo(() => getNavItemsForOrgWeb(content, pathname), [content, pathname]);

  // Permanent "More" items (Docs, Resources)
  const moreItems = useMemo(() => allItems.filter((it) => MORE_LABELS.has(it.label)), [allItems]);

  // Main items (everything except More items)
  const mainItems = useMemo(() => allItems.filter((it) => !MORE_LABELS.has(it.label)), [allItems]);

  // Split main items around the "//" separator
  const sepIndex = useMemo(() => mainItems.findIndex((it) => it.label === "//"), [mainItems]);
  const beforeSep = useMemo(() => (sepIndex >= 0 ? mainItems.slice(0, sepIndex) : mainItems), [mainItems, sepIndex]);
  const afterSep = useMemo(() => (sepIndex >= 0 ? mainItems.slice(sepIndex + 1) : []), [mainItems, sepIndex]);
  const hasSep = afterSep.length > 0;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navRef, indicator] = useActiveIndicator(pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(beforeSep.length);

  const headerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const widthsCacheRef = useRef<number[]>([]);

  const title = (site as { title?: string }).title ?? "Web3Privacy Now";
  const headerLogo = (site as { headerLogo?: string }).headerLogo ?? "/images/site-shared/navigation/nav-logo.svg";

  const recalculate = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;
    const widths = widthsCacheRef.current;
    if (!widths.length) return;

    const B = beforeSep.length;

    if (window.innerWidth <= MOBILE_BP) {
      setVisibleCount(B);
      return;
    }

    const brand = header.querySelector(".brand") as HTMLElement;
    if (!brand) return;

    const cs = getComputedStyle(header);
    const padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const nav = header.querySelector("nav") as HTMLElement;
    const ml = nav ? parseFloat(getComputedStyle(nav).marginLeft) || 0 : 40;
    const navLinks = header.querySelector(".nav-links") as HTMLElement;
    const gap = navLinks ? parseFloat(getComputedStyle(navLinks).gap) || 28 : 28;

    const brandW = Math.max(brand.offsetWidth, brand.scrollWidth);
    const space = header.clientWidth - padH - brandW - ml;

    // Widths layout: [beforeSep..., "More", sep?, afterSep...]
    const wMore = widths[B];
    let fixedWidth = wMore;
    let fixedChildren = 1;
    let idx = B + 1;
    if (hasSep) {
      fixedWidth += widths[idx];
      fixedChildren++;
      idx++;
    }
    for (let j = 0; j < afterSep.length; j++) {
      fixedWidth += widths[idx + j];
      fixedChildren++;
    }

    // Base: fixed items + gaps between them only
    const base = fixedWidth + Math.max(0, fixedChildren - 1) * gap;
    // Each beforeSep item adds its width + one gap (between it and the next child)
    const available = space - base;

    // Try to fit all beforeSep items first
    let totalBeforeSep = 0;
    for (let i = 0; i < B; i++) totalBeforeSep += widths[i] + gap;
    if (totalBeforeSep <= available) {
      setVisibleCount(B);
      return;
    }

    // Fit as many as possible
    let used = 0;
    let count = 0;
    for (let i = 0; i < B; i++) {
      const cost = widths[i] + gap;
      if (used + cost <= available) {
        used += cost;
        count++;
      } else break;
    }

    // Don't end on a separator
    while (count > 0 && beforeSep[count - 1]?.label === "//") count--;
    setVisibleCount(Math.max(0, count));
  }, [beforeSep, afterSep.length, hasSep]);

  useLayoutEffect(() => {
    const mc = measureRef.current;
    if (!mc) return;
    const children = Array.from(mc.children) as HTMLElement[];
    widthsCacheRef.current = children.map((el) => {
      const s = getComputedStyle(el);
      return el.offsetWidth + parseFloat(s.marginLeft || "0") + parseFloat(s.marginRight || "0");
    });
    recalculate();
  }, [beforeSep, afterSep, recalculate]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const ro = new ResizeObserver(recalculate);
    ro.observe(header);
    return () => ro.disconnect();
  }, [recalculate]);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".nav-more-wrap")) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // Items that overflowed from the main row into the "More" dropdown
  const overflowedItems = beforeSep.slice(visibleCount).filter((it) => it.label !== "//");
  // All dropdown items: overflowed + permanent
  const allMoreActive = [...overflowedItems, ...moreItems].some((it) => isNavItemActive(it.href ?? "", pathname));

  const closeMobile = () => setMobileNavOpen(false);
  const closeAll = () => { setMoreOpen(false); setMobileNavOpen(false); };

  /** Render a single nav link (internal or external) */
  const renderNavLink = (item: NavItem, extraCls?: string, onClick?: () => void) => {
    const cls = [
      isNavItemActive(item.href ?? "", pathname) ? "nav-item-active" : "",
      extraCls ?? "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          onClick={onClick}
        >
          {item.label}
          {item.label === "FORUM" && <ExpandIcon />}
        </a>
      );
    }
    return (
      <Link key={item.label} href={item.href ?? "/"} className={cls} onClick={onClick}>
        {item.label}
      </Link>
    );
  };

  return (
    <header ref={headerRef} className="top-nav">
      <Link href="/" className="brand" aria-label={title} onClick={closeAll}>
        <Image
          src={headerLogo}
          alt={title}
          width={285}
          height={27}
          loader={passthroughImageLoader}
          unoptimized
        />
      </Link>

      {/* Hidden measurement container: beforeSep items, "More", sep?, afterSep items */}
      <div ref={measureRef} className="nav-measure" aria-hidden="true">
        {beforeSep.map((item) => (
          <span key={item.label} className={item.label === "//" ? "nav-sep" : "nav-measure-item"}>
            {item.label !== "//" && (
              <>
                {item.label}
                {item.label === "FORUM" && <ExpandIcon />}
              </>
            )}
          </span>
        ))}
        <span className="nav-measure-item">More</span>
        {hasSep && <span className="nav-sep" />}
        {afterSep.map((item) => (
          <span key={item.label} className="nav-measure-item">
            {item.label}
            {item.label === "FORUM" && <ExpandIcon />}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav ref={navRef} className={mobileNavOpen ? "nav-open" : ""}>
        <div className="nav-links">
          {/* ── Before-separator items ── */}
          {beforeSep.map((item, i) => {
            const isOverflow = i >= visibleCount;
            const overflowCls = isOverflow ? "nav-item-overflow" : "";

            if (item.label === "//") {
              return <span key="pre-sep" className={`nav-sep ${overflowCls}`.trim()} aria-hidden />;
            }
            return renderNavLink(item, overflowCls, closeAll);
          })}

          {/* ── Mobile-only: More items in their natural position (before separator) ── */}
          {moreItems.map((item) => (
            <Link
              key={`mobile-${item.label}`}
              href={item.href ?? "/"}
              className={`nav-more-mobile-item${isNavItemActive(item.href ?? "", pathname) ? " nav-item-active" : ""}`}
              onClick={closeAll}
            >
              {item.label}
            </Link>
          ))}

          {/* ── "More" dropdown (desktop/tablet only) ── */}
          <div className="nav-more-wrap">
            <button
              type="button"
              className={`nav-more-toggle${allMoreActive ? " nav-item-active" : ""}`}
              aria-expanded={moreOpen}
              onClick={(e) => { e.stopPropagation(); setMoreOpen((v) => !v); }}
            >
              More
              <svg className="nav-more-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {moreOpen && (
              <div className="nav-overflow-dropdown">
                {overflowedItems.map((item) => renderNavLink(item, undefined, closeAll))}
                {overflowedItems.length > 0 && moreItems.length > 0 && (
                  <div className="nav-more-divider" />
                )}
                {moreItems.map((item) => renderNavLink(item, undefined, closeAll))}
              </div>
            )}
          </div>

          {/* ── Separator ── */}
          {hasSep && <span className="nav-sep" aria-hidden />}

          {/* ── After-separator items (Privacy Portal) ── */}
          {afterSep.map((item) => renderNavLink(item, undefined, closeMobile))}
        </div>

        <div className="nav-active-indicator" style={{ left: indicator.left, width: indicator.width }} aria-hidden />
      </nav>

      {mobileNavOpen && <div className="nav-overlay" aria-hidden onClick={closeMobile} />}
    </header>
  );
}

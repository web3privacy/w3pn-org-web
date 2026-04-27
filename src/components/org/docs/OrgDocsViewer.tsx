"use client";

import { useState, useEffect } from "react";
import DocsNav from "./DocsNav";
import DocContent from "./DocContent";
import OnThisPage from "./OnThisPage";

const BASE_PATH = "/docs";
const MOBILE_BREAKPOINT = 1024;

type SidebarBlock = { label: string; link?: string; items?: { label: string; link: string }[] };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function getSlugFromParam(slugParam: string[] | undefined): string {
  if (!slugParam || slugParam.length === 0) return "";
  return slugParam.join("/").replace(/\/$/, "");
}

function resolveFilePath(
  slug: string,
  manifest: Record<string, unknown> | null
): string | null {
  if (!slug) return (manifest as { files?: { index?: string } })?.files?.index ?? "index.mdx";
  const normalized = slug.toLowerCase();
  const files = (manifest as { files?: Record<string, string> })?.files;
  if (files?.[normalized]) return files[normalized];
  if (slug.startsWith("portal-and-org-web")) return `${slug}.md`;
  return null;
}

export default function OrgDocsViewer({
  slugParam,
  initialSidebar,
  initialManifest,
  initialRawMarkdown,
  initialFilePath,
  initialLastUpdated,
  initialError,
}: {
  slugParam: string[] | undefined;
  initialSidebar: SidebarBlock[] | null;
  initialManifest?: Record<string, unknown> | null;
  initialRawMarkdown?: string;
  initialFilePath?: string | null;
  initialLastUpdated?: string | null;
  initialError?: string | null;
}) {
  const slug = getSlugFromParam(slugParam);
  const [headings, setHeadings] = useState<{ level: number; text: string; id: string }[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const sidebar = initialSidebar;
  const manifest = initialManifest ?? null;
  const rawMarkdown = initialRawMarkdown ?? "";
  const filePath = initialFilePath ?? resolveFilePath(slug, manifest);
  const error = initialError ?? null;
  const lastUpdated = initialLastUpdated ?? null;

  // Lock body scroll when mobile/tablet docs nav overlay is open
  useEffect(() => {
    if (!mobileNavOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, isMobile]);

  if (error && !rawMarkdown) {
    return (
      <main className="landing-root docs-root" style={{ padding: "120px 24px", textAlign: "center" }}>
        <p>{error}</p>
        <a href={BASE_PATH} className="primary-btn" style={{ marginTop: 16 }}>Back to Docs</a>
      </main>
    );
  }

  // Derive current page label from sidebar for the toggle button
  const currentLabel = (() => {
    if (!sidebar) return "Documentation";
    for (const block of sidebar) {
      if (block.link === slug || block.link === `/${slug}`) return block.label;
      if (block.items) {
        for (const item of block.items) {
          const itemSlug = item.link.replace(/^\//, "");
          if (itemSlug === slug) return `${block.label} › ${item.label}`;
        }
      }
    }
    return "Documentation";
  })();

  return (
    <main className="landing-root docs-root" id="top">
      <div className="docs-outer-wrap">
        <div className="docs-container">
          {/* Title visible on tablet + mobile */}
          <h1 className="docs-page-title">Documentation</h1>

          <div className={`docs-sidebar-wrap ${mobileNavOpen ? "docs-sidebar-wrap--open" : ""}`}>
            <button
              type="button"
              className="docs-mobile-nav-toggle"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-expanded={mobileNavOpen}
              aria-controls="docs-sidebar-nav"
            >
              <span className="docs-mobile-nav-toggle-label">{mobileNavOpen ? "Close menu" : currentLabel}</span>
              <span className="docs-mobile-nav-toggle-icon" aria-hidden />
            </button>
            {mobileNavOpen && (
              <div
                className="docs-sidebar-backdrop"
                role="presentation"
                onClick={() => setMobileNavOpen(false)}
              />
            )}
            {mobileNavOpen && (
              <button
                type="button"
                className="docs-mobile-overlay-close"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            <aside id="docs-sidebar-nav" className="docs-sidebar" aria-hidden={isMobile ? !mobileNavOpen : false}>
              <DocsNav
                sidebar={sidebar}
                basePath={BASE_PATH}
                currentSlug={slug}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </aside>
          </div>
          <div className="docs-main">
            <DocContent
              slug={slug}
              filePath={filePath}
              rawMarkdown={rawMarkdown}
              lastUpdated={lastUpdated}
              onHeadings={setHeadings}
            />
          </div>
          <aside className="docs-aside">
            <OnThisPage headings={headings} />
          </aside>
        </div>
      </div>
    </main>
  );
}

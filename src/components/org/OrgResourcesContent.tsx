"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGalleryPointerSwipe } from "@/hooks/use-gallery-pointer-swipe";
import { useLightboxIntrinsicCssVars } from "@/hooks/use-lightbox-intrinsic-css-vars";

type Content = Record<string, unknown>;

type ResourceAsset = {
  id?: string;
  name?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  description?: string;
};

type ResourceGroup = {
  name?: string;
  assets?: ResourceAsset[];
};

type ResourceCategory = {
  id?: string;
  name?: string;
  order?: number;
  assets?: ResourceAsset[];
  groups?: ResourceGroup[];
};

type Kit = {
  id?: string;
  name?: string;
  description?: string;
  href?: string;
  logoUrl?: string;
};

type ResourcesConfig = {
  hero?: {
    title?: string;
    description?: string;
    backgroundImageUrl?: string;
    downloadAllLabel?: string;
    downloadAllHref?: string;
  };
  kits?: Kit[];
  expandAllLabel?: string;
  categories?: ResourceCategory[];
};

type ResourceSurfaceVariant = "default" | "light" | "dark";

const DARK_SURFACE_RESOURCE_IDS = new Set([
  "logo-web3privacy-logo",
  "logo-web3privacy-logo-horizontal",
  "logo-w3pn-mini-logo-full",
  "logo-logo-people",
  "logo-sticker-logo-horizontal-2",
]);

function getResourceSurfaceVariant(asset?: ResourceAsset): ResourceSurfaceVariant {
  if (!asset) return "default";

  if (asset.id?.startsWith("stamp-")) {
    return "light";
  }

  if (asset.id && DARK_SURFACE_RESOURCE_IDS.has(asset.id)) {
    return "dark";
  }

  const src = asset.thumbnailUrl ?? asset.previewUrl ?? asset.downloadUrl ?? "";
  if (src.includes("/source-files/_W3PN-LOGOS/")) {
    return "light";
  }

  return "default";
}

function AssetThumbnail({
  asset,
  onOpen,
}: {
  asset: ResourceAsset;
  onOpen: (asset: ResourceAsset) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const thumbSrc = asset.thumbnailUrl ?? "";
  const surfaceVariant = getResourceSurfaceVariant(asset);
  const hasThumb = !!asset.thumbnailUrl && !imgError;
  const isPhoto = /\.(jpg|jpeg|png|webp)$/i.test(thumbSrc) && surfaceVariant === "default";
  const downloadHref = asset.downloadUrl ?? asset.thumbnailUrl ?? "";

  return (
    <div
      className={`resources-thumb-card${isPhoto ? " resources-thumb-card--photo" : ""}${surfaceVariant === "light" ? " resources-thumb-card--light-surface" : ""}${surfaceVariant === "dark" ? " resources-thumb-card--dark-surface" : ""}`}
    >
      <button
        type="button"
        className="resources-thumb-item"
        onClick={() => onOpen(asset)}
        title={asset.name ?? "View asset"}
      >
        {hasThumb && (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name ?? ""}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`resources-thumb-img ${imgLoaded ? "is-loaded" : ""}`}
          />
        )}
        {(!hasThumb || !imgLoaded) && (
          <div className="resources-thumb-placeholder" aria-hidden>
            <span className="resources-thumb-placeholder-icon">&#9671;</span>
          </div>
        )}
      </button>

      <div className="resources-thumb-card-info">
        {asset.name && (
          <span className="resources-thumb-card-name">{asset.name}</span>
        )}
        {downloadHref && (
          <a
            href={downloadHref}
            download
            target="_blank"
            rel="noreferrer noopener"
            className="resources-thumb-card-dl"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}

function SubgroupSection({
  group,
  onOpen,
}: {
  group: ResourceGroup;
  onOpen: (asset: ResourceAsset) => void;
}) {
  const assets = group.assets ?? [];
  if (assets.length === 0) return null;

  return (
    <div className="resources-subgroup">
      {group.name && (
        <div className="resources-subgroup-header">
          <span className="resources-subgroup-line" />
          <span className="resources-subgroup-title">{group.name}</span>
          <span className="resources-subgroup-line" />
        </div>
      )}
      <div className="resources-thumb-grid">
        {assets.map((asset) => (
          <AssetThumbnail key={asset.id ?? asset.name} asset={asset} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

const CLOSE_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DOWNLOAD_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ARROW_LEFT_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ARROW_RIGHT_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

function AssetLightbox({
  assets,
  currentIndex,
  onNavigate,
  onClose,
}: {
  assets: ResourceAsset[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const asset = assets[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < assets.length - 1;
  const previewSrc = asset?.previewUrl ?? asset?.downloadUrl ?? asset?.thumbnailUrl ?? "";
  const surfaceVariant = getResourceSurfaceVariant(asset);
  const { imgStyle, onImageLoad } = useLightboxIntrinsicCssVars(`${currentIndex}-${previewSrc}`);

  const onSwipePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const onSwipeNext = useCallback(() => {
    if (currentIndex < assets.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, assets.length, onNavigate]);

  const { swipeHandlers } = useGalleryPointerSwipe(onSwipePrev, onSwipeNext, {
    disabled: assets.length < 2,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < assets.length - 1) onNavigate(currentIndex + 1);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, currentIndex, assets.length]);

  if (!asset) return null;

  return (
    <div
      className="resources-lightbox-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={asset.name ?? "Asset preview"}
    >
      {/* Prev button */}
      {hasPrev && (
        <button
          type="button"
          className="resources-lightbox-arrow resources-lightbox-arrow--prev"
          onClick={() => onNavigate(currentIndex - 1)}
          aria-label="Previous"
        >
          {ARROW_LEFT_SVG}
        </button>
      )}

      <div className="resources-lightbox" ref={dialogRef}>
        <button
          type="button"
          className="resources-lightbox-close"
          onClick={onClose}
          aria-label="Close preview"
        >
          {CLOSE_SVG}
        </button>

        <div
          className={`resources-lightbox-img-wrap${surfaceVariant === "light" ? " resources-lightbox-img-wrap--light" : ""}${surfaceVariant === "dark" ? " resources-lightbox-img-wrap--dark" : ""}`}
          {...swipeHandlers}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={asset.name ?? ""}
              className="resources-lightbox-img"
              style={imgStyle}
              onLoad={onImageLoad}
            />
          ) : (
            <div className="resources-lightbox-placeholder">No preview</div>
          )}
        </div>

        <div className="resources-lightbox-footer">
          <span className="resources-lightbox-counter">
            {currentIndex + 1} / {assets.length}
          </span>
          {asset.name && (
            <span className="resources-lightbox-name">{asset.name}</span>
          )}
          {asset.downloadUrl ? (
            <a
              href={asset.downloadUrl}
              download
              className="resources-lightbox-download"
              target="_blank"
              rel="noreferrer noopener"
            >
              {DOWNLOAD_SVG}
              Download
            </a>
          ) : previewSrc ? (
            <a
              href={previewSrc}
              download
              className="resources-lightbox-download"
              target="_blank"
              rel="noreferrer noopener"
            >
              {DOWNLOAD_SVG}
              Download
            </a>
          ) : null}
        </div>
      </div>

      {/* Next button */}
      {hasNext && (
        <button
          type="button"
          className="resources-lightbox-arrow resources-lightbox-arrow--next"
          onClick={() => onNavigate(currentIndex + 1)}
          aria-label="Next"
        >
          {ARROW_RIGHT_SVG}
        </button>
      )}
    </div>
  );
}

const CHEVRON_SVG = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Categories open by default on first load; others start collapsed. */
const RESOURCES_DEFAULT_OPEN_IDS = new Set(["logos", "infographics", "posters"]);

export default function OrgResourcesContent({ content }: { content: Content }) {
  const config = (content?.resources ?? {}) as ResourcesConfig;
  const categories = useMemo(
    () => [...(config.categories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [config.categories],
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    categories.forEach((category) => {
      if (category.id) next[category.id] = RESOURCES_DEFAULT_OPEN_IDS.has(category.id);
    });
    return next;
  });
  const [activeTab, setActiveTab] = useState<string | null>(() => categories[0]?.id ?? null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Flat list of all assets across all categories/groups (for lightbox navigation)
  const allAssets = useMemo(() => {
    const list: ResourceAsset[] = [];
    for (const cat of categories) {
      if (cat.groups) {
        for (const g of cat.groups) {
          if (g.assets) list.push(...g.assets);
        }
      } else if (cat.assets) {
        list.push(...cat.assets);
      }
    }
    return list;
  }, [categories]);

  const openLightbox = useCallback(
    (asset: ResourceAsset) => {
      const idx = allAssets.findIndex(
        (a) => (a.id && a.id === asset.id) || (a.thumbnailUrl && a.thumbnailUrl === asset.thumbnailUrl),
      );
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [allAssets],
  );

  const allExpanded =
    categories.length > 0 && categories.every((c) => c.id != null && expanded[c.id!]);

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const all: Record<string, boolean> = {};
      categories.forEach((c) => {
        if (c.id) all[c.id] = true;
      });
      setExpanded(all);
    }
  }, [allExpanded, categories]);

  const toggleCategory = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollToCategory = useCallback(
    (id: string) => {
      setExpanded((prev) => ({ ...prev, [id]: true }));
      setActiveTab(id);
      setMobileNavOpen(false);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  // Lock body scroll when mobile dropdown is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    const ids = categories.map((c) => c.id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportMid = scrollY + window.innerHeight / 3;

      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY;
          if (top <= viewportMid) {
            setActiveTab(ids[i]);
            return;
          }
        }
      }
      setActiveTab(ids[0]);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const hero = config.hero ?? {};
  const title = hero.title ?? "Community Resources";
  const description = hero.description ?? "";
  const downloadAllLabel = hero.downloadAllLabel ?? "Download all";
  const downloadAllHref = hero.downloadAllHref ?? "";
  const kits = config.kits ?? [];
  const mobileExtraKit: Kit = {
    id: "figma-design-mobile",
    name: "FIGMA DESIGN",
    description: "UI kit and component templates",
    href: "#",
    logoUrl: "/images/home/sections/activities/assets/projects/personal-stacks-logo.webp",
  };
  const renderedKits = [...kits, mobileExtraKit];
  const fallbackKitLogos: Record<string, string> = {
    "media-kit": "/images/projects/page/assets/projects/explorer-logo.svg",
    "event-kit": "/images/home/sections/activities/assets/projects/events-logo.webp",
    "generated-images": "/images/home/sections/activities/assets/projects/academy-logo.webp",
    "figma-design-mobile": "/images/home/sections/activities/assets/projects/personal-stacks-logo.webp",
  };
  const expandAllLabel = allExpanded
    ? "Collapse All"
    : (config.expandAllLabel ?? "Expand All");

  const activeLabel =
    categories.find((c) => c.id === activeTab)?.name ?? categories[0]?.name ?? "";

  const getCategoryGroups = (cat: ResourceCategory): ResourceGroup[] => {
    if (cat.groups && cat.groups.length > 0) return cat.groups;
    if (cat.assets && cat.assets.length > 0) return [{ assets: cat.assets }];
    return [];
  };

  return (
    <main className="landing-root resources-page">
      {lightboxIndex !== null && (
        <AssetLightbox
          assets={allAssets}
          currentIndex={lightboxIndex}
          onNavigate={setLightboxIndex}
          onClose={closeLightbox}
        />
      )}
      {/* Hero */}
      <section className="resources-hero">
        {hero.backgroundImageUrl ? (
          <div
            className="resources-hero-bg"
            style={{ backgroundImage: `url(${hero.backgroundImageUrl})` }}
            aria-hidden
          />
        ) : (
          <div className="resources-hero-bg resources-hero-bg--default" aria-hidden />
        )}
        <div className="resources-hero-inner">
          <h1 className="resources-hero-title">{title}</h1>
          {description && <p className="resources-hero-description">{description}</p>}
          {downloadAllHref && (
            <a
              href={downloadAllHref}
              download
              className="resources-hero-download-all"
              target="_blank"
              rel="noreferrer noopener"
            >
              {downloadAllLabel}
            </a>
          )}
        </div>
      </section>

      {/* Kit cards — temporarily hidden until data is ready (set showKits to true to re-enable) */}
      {false && kits.length > 0 && (
        <section className="resources-kits">
          {renderedKits.map((kit) => {
            const logoUrl = kit.logoUrl ?? (kit.id ? fallbackKitLogos[kit.id] : undefined);
            const isMobileOnlyCard = kit.id === "figma-design-mobile";
            return (
            <a
              key={kit.id ?? kit.name}
              href={kit.href ?? "#"}
              className={`resources-kit-card ${isMobileOnlyCard ? "resources-kit-card--mobile-only" : ""}`}
              target={kit.href?.startsWith("http") ? "_blank" : undefined}
              rel={kit.href?.startsWith("http") ? "noreferrer noopener" : undefined}
            >
              <div className="resources-kit-card-visual" aria-hidden>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="resources-kit-logo"
                    loading="lazy"
                  />
                ) : (
                  <span className="resources-kit-logo-placeholder">&#9671;</span>
                )}
              </div>
              <div className="resources-kit-card-body">
                <h3 className="resources-kit-title">{kit.name}</h3>
                {kit.description && (
                  <p className="resources-kit-desc">{kit.description}</p>
                )}
              </div>
            </a>
            );
          })}
        </section>
      )}
      {false && kits.length > 0 && <div className="resources-kits-divider" aria-hidden />}

      <div className="resources-main">
        {/* Category Navigation */}
        {categories.length > 0 && (
          <nav className="resources-nav" aria-label="Resource categories">
            {/* Desktop: horizontal pill */}
            <div className="resources-nav-pill resources-nav-desktop">
              <ul className="resources-nav-list">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => scrollToCategory(cat.id!)}
                      className={`resources-nav-item ${activeTab === cat.id ? "is-active" : ""}`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: dropdown */}
            <div className="resources-nav-mobile">
              <button
                type="button"
                onClick={() => setMobileNavOpen((o) => !o)}
                className="resources-nav-trigger"
                aria-expanded={mobileNavOpen}
              >
                <span className="resources-nav-trigger-label">{activeLabel}</span>
                <span
                  className={`resources-nav-trigger-chevron ${mobileNavOpen ? "is-open" : ""}`}
                >
                  {CHEVRON_SVG}
                </span>
              </button>
              {mobileNavOpen && (
                <>
                  <div
                    className="resources-nav-backdrop"
                    onClick={() => setMobileNavOpen(false)}
                  />
                  <ul className="resources-nav-dropdown" role="listbox">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={activeTab === cat.id}
                          onClick={() => scrollToCategory(cat.id!)}
                          className={`resources-nav-dropdown-item ${activeTab === cat.id ? "is-active" : ""}`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </nav>
        )}

        {/* Category Sections */}
        <div className="resources-sections">
          {categories.map((cat, catIdx) => {
            const isOpen = expanded[cat.id ?? ""];
            const groups = getCategoryGroups(cat);
            const hasContent = groups.some((g) => (g.assets ?? []).length > 0);

            return (
              <section
                key={cat.id ?? cat.name}
                id={cat.id}
                className="resources-section"
              >
                <div className="resources-section-header">
                  <button
                    type="button"
                    className="resources-section-toggle"
                    onClick={() => toggleCategory(cat.id ?? "")}
                    aria-expanded={isOpen}
                  >
                    <span className="resources-section-name">{cat.name}</span>
                    <span
                      className={`resources-section-chevron ${isOpen ? "is-open" : ""}`}
                    >
                      {CHEVRON_SVG}
                    </span>
                  </button>
                  {catIdx === 0 && (
                    <button
                      type="button"
                      className="resources-expand-all-link"
                      onClick={toggleExpandAll}
                    >
                      {expandAllLabel}
                    </button>
                  )}
                </div>

                {isOpen && hasContent && (
                  <div className="resources-section-content">
                    {groups.map((group, gIdx) => (
                      <SubgroupSection key={group.name ?? gIdx} group={group} onOpen={openLightbox} />
                    ))}
                  </div>
                )}
                {isOpen && !hasContent && (
                  <div className="resources-section-content">
                    <p className="resources-empty-category">
                      No assets in this category yet.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

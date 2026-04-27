"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useGalleryPointerSwipe } from "@/hooks/use-gallery-pointer-swipe";
import { useLightboxIntrinsicCssVars } from "@/hooks/use-lightbox-intrinsic-css-vars";
import { Icon } from "@/components/ui/icon";
import { FadeIn, StaggerContainer, StaggerItem } from "./ScrollAnimations";

export type AboutGalleryImage =
  | string
  | {
      thumbnailUrl?: string;
      previewUrl?: string;
      fullSizeUrl?: string;
      url?: string;
      caption?: string;
    };

export type AboutGalleryData = { title?: string; images?: AboutGalleryImage[] };

export type AboutGallerySectionProps = {
  gallery?: AboutGalleryData;
  /** Custom heading (e.g. image). When set, gallery.title is ignored. */
  titleNode?: React.ReactNode;
  /** Extra class name(s) for the section wrapper (e.g. "event-detail-section"). */
  sectionClassName?: string;
  /**
   * `marquee` — three horizontal scrolling rows (About page).
   * `eventGrid` — responsive grid + show-more (event detail only).
   */
  layout?: "marquee" | "eventGrid";
};

const ROW_COUNT = 3;
const ROW_COPIES = 3;
const SCROLL_STEP = 200;
const SCROLL_JUMP_THRESHOLD = 60;
/** Minimum number of images per row so all 3 rows are filled and span full width */
const MIN_IMAGES_PER_ROW = 10;

/** Collapsed event grid: 8 for 2- / 4-col; 9 for 768–1024px (3×3). */
const EVENT_GRID_INITIAL_DEFAULT = 8;
const EVENT_GRID_INITIAL_TABLET_3COL = 9;

type NormalizedGalleryImage = {
  thumbnailUrl: string;
  previewUrl: string;
  fullSizeUrl: string;
  caption?: string;
};

function repeatToFill<T>(arr: T[], minTotal: number): T[] {
  if (arr.length === 0) return [];
  const result: T[] = [];
  while (result.length < minTotal) result.push(...arr);
  return result;
}

function normalizeGalleryImage(image: AboutGalleryImage): NormalizedGalleryImage {
  if (typeof image === "string") {
    return { thumbnailUrl: image, previewUrl: image, fullSizeUrl: image };
  }
  const fullSizeUrl =
    image.fullSizeUrl?.trim() || image.previewUrl?.trim() || image.url?.trim() || image.thumbnailUrl?.trim() || "";
  const previewUrl = image.previewUrl?.trim() || fullSizeUrl;
  const thumbnailUrl = image.thumbnailUrl?.trim() || previewUrl || fullSizeUrl;
  return {
    thumbnailUrl,
    previewUrl,
    fullSizeUrl,
    caption: image.caption?.trim() || undefined,
  };
}

/**
 * Gallery: 3 horizontal scrolling rows (round-robin distribution).
 * Clicking an image opens a fullscreen overlay with prev/next/close.
 * `layout="marquee"`: About page (and defaults). `layout="eventGrid"`: event detail — grid + expand.
 */
export function AboutGallerySection({
  gallery,
  titleNode,
  sectionClassName,
  layout = "marquee",
}: AboutGallerySectionProps) {
  const images = (gallery?.images ?? []).map(normalizeGalleryImage).filter((img) => img.fullSizeUrl);
  const imageCount = images.length;
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);
  const [eventGridExpanded, setEventGridExpanded] = useState(false);
  const [eventGridCap, setEventGridCap] = useState(EVENT_GRID_INITIAL_DEFAULT);

  useEffect(() => {
    if (layout !== "eventGrid" || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
    const sync = () => setEventGridCap(mq.matches ? EVENT_GRID_INITIAL_TABLET_3COL : EVENT_GRID_INITIAL_DEFAULT);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [layout]);

  /* Repeat images so all 3 rows are filled and span full width; overlay still uses original indices */
  const filledImages = repeatToFill(images, ROW_COUNT * MIN_IMAGES_PER_ROW);
  const rows: NormalizedGalleryImage[][] = [[], [], []];
  filledImages.forEach((src, i) => rows[i % ROW_COUNT].push(src));

  const openOverlay = useCallback((index: number) => setOverlayIndex(index), []);
  const closeOverlay = useCallback(() => setOverlayIndex(null), []);
  const goPrev = useCallback(
    () =>
      setOverlayIndex((v) =>
        v === null ? null : (v - 1 + imageCount) % imageCount
      ),
    [imageCount]
  );
  const goNext = useCallback(
    () =>
      setOverlayIndex((v) =>
        v === null ? null : (v + 1) % imageCount
      ),
    [imageCount]
  );

  const scrollRef0 = useRef<HTMLDivElement>(null);
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);
  const scrollRefs = [scrollRef0, scrollRef1, scrollRef2];

  /** Drive row 0 only; marquee sync effect mirrors scrollLeft to rows 1–2 (avoids three smooth scrolls fighting). */
  const scrollAllRows = useCallback((dir: number) => {
    const el = scrollRef0.current;
    if (el) el.scrollBy({ left: dir * SCROLL_STEP, behavior: "smooth" });
  }, []);

  /** Marquee: infinite loop + same scrollLeft on all rows (touch). Snap + mismatched track widths caused jitter. */
  useLayoutEffect(() => {
    if (layout !== "marquee" || !images.length) return undefined;
    const el0 = scrollRef0.current;
    const el1 = scrollRef1.current;
    const el2 = scrollRef2.current;
    if (!el0 || !el1 || !el2) return undefined;

    const els: HTMLDivElement[] = [el0, el1, el2];

    const trackOf = (el: HTMLDivElement) =>
      el.querySelector<HTMLElement>(".about-gallery-row-track");

    const equalizeTrackWidths = () => {
      const tracks = els.map(trackOf).filter(Boolean) as HTMLElement[];
      if (tracks.length !== 3) return false;
      for (const t of tracks) {
        t.style.minWidth = "";
      }
      void el0.offsetHeight;
      const maxW = Math.max(...tracks.map((t) => t.scrollWidth));
      if (maxW <= 0) return false;
      for (const t of tracks) {
        t.style.minWidth = `${maxW}px`;
      }
      return true;
    };

    const metrics = () => {
      const t0 = trackOf(el0);
      if (!t0) return null;
      const totalWidth = t0.scrollWidth;
      if (totalWidth <= 0) return null;
      const copyWidth = totalWidth / ROW_COPIES;
      const maxScroll = totalWidth - el0.clientWidth;
      if (maxScroll <= 0) return null;
      return { copyWidth, totalWidth };
    };

    const initScroll = () => {
      equalizeTrackWidths();
      const m = metrics();
      if (!m) return false;
      const { copyWidth } = m;
      const start = copyWidth;
      for (const el of els) {
        el.scrollLeft = start;
      }
      return true;
    };

    if (!initScroll()) return undefined;

    let syncGuard = false;
    let rafId = 0;
    let pendingSource: HTMLDivElement | null = null;

    const infiniteAndSync = (source: HTMLDivElement) => {
      const m = metrics();
      if (!m) return;
      const { copyWidth } = m;
      const left = source.scrollLeft;

      if (left >= copyWidth * 2 - SCROLL_JUMP_THRESHOLD) {
        const newLeft = left - copyWidth;
        syncGuard = true;
        for (const el of els) {
          el.scrollLeft = newLeft;
        }
        syncGuard = false;
        return;
      }
      if (left <= SCROLL_JUMP_THRESHOLD) {
        const newLeft = left + copyWidth;
        syncGuard = true;
        for (const el of els) {
          el.scrollLeft = newLeft;
        }
        syncGuard = false;
        return;
      }

      syncGuard = true;
      for (const el of els) {
        if (el !== source) el.scrollLeft = left;
      }
      syncGuard = false;
    };

    const flushScroll = () => {
      rafId = 0;
      if (syncGuard) {
        pendingSource = null;
        return;
      }
      const source = pendingSource;
      pendingSource = null;
      if (!source || !els.includes(source)) return;
      infiniteAndSync(source);
    };

    const onScroll = (e: Event) => {
      if (syncGuard) return;
      const source = e.target as HTMLDivElement;
      if (!els.includes(source)) return;
      pendingSource = source;
      if (!rafId) {
        rafId = requestAnimationFrame(flushScroll);
      }
    };

    const roTracks = els.map(trackOf).filter(Boolean) as HTMLElement[];
    let roRaf = 0;
    const onTracksResize = () => {
      if (roRaf) return;
      roRaf = requestAnimationFrame(() => {
        roRaf = 0;
        equalizeTrackWidths();
        if (syncGuard) return;
        const m = metrics();
        if (!m) return;
        const max0 = Math.max(0, el0.scrollWidth - el0.clientWidth);
        const leader = Math.min(Math.max(0, el0.scrollLeft), max0);
        syncGuard = true;
        el1.scrollLeft = leader;
        el2.scrollLeft = leader;
        syncGuard = false;
      });
    };

    const ro =
      typeof ResizeObserver !== "undefined" && roTracks.length === 3
        ? new ResizeObserver(onTracksResize)
        : null;
    roTracks.forEach((t) => ro?.observe(t));

    els.forEach((el) => el.addEventListener("scroll", onScroll, { passive: true }));
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (roRaf) cancelAnimationFrame(roRaf);
      ro?.disconnect();
      els.forEach((el) => el.removeEventListener("scroll", onScroll));
      for (const t of roTracks) {
        t.style.minWidth = "";
      }
    };
  }, [layout, images.length, filledImages.length]);

  if (!images.length) return null;

  const sectionClass = [
    "about-section",
    "about-gallery-section",
    sectionClassName,
    layout === "eventGrid" ? "about-gallery-section--event-grid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const eventGridVisibleCount =
    layout === "eventGrid"
      ? eventGridExpanded
        ? images.length
        : Math.min(eventGridCap, images.length)
      : 0;
  const eventGridNeedsToggle = layout === "eventGrid" && images.length > eventGridCap;

  return (
    <>
      <section className={sectionClass} id="gallery">
        <div className="about-gallery-section-bg" aria-hidden />
        {titleNode !== undefined ? (
          <FadeIn><div className="about-gallery-section-title-wrap">{titleNode}</div></FadeIn>
        ) : (
          <FadeIn>
            <h2 className="about-gallery-section-title">
              {gallery?.title ?? "Web3Privacy Now! Experience"}
            </h2>
          </FadeIn>
        )}
        {layout === "eventGrid" ? (
          <FadeIn delay={0.08}>
            <div className="about-gallery-event-grid-inner">
              <div className="about-gallery-event-grid">
                {images.slice(0, eventGridVisibleCount).map((src, index) => (
                  <button
                    key={`${src.fullSizeUrl}-${index}`}
                    type="button"
                    className="about-gallery-item about-gallery-item--event-grid"
                    onClick={() => openOverlay(index)}
                    aria-label={src.caption ? `View image: ${src.caption}` : "View image fullscreen"}
                  >
                    <img
                      src={src.thumbnailUrl || src.fullSizeUrl}
                      alt={src.caption ?? ""}
                      loading={index < 6 ? "eager" : "lazy"}
                      draggable={false}
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
              {eventGridNeedsToggle && (
                <div className="event-detail-talks-show-all-wrap about-gallery-event-grid-toggle">
                  <button
                    type="button"
                    className="event-detail-speakers-show-all"
                    onClick={() => setEventGridExpanded((v) => !v)}
                    aria-expanded={eventGridExpanded}
                  >
                    {eventGridExpanded ? "Show less" : `Show all photos (${images.length})`}
                  </button>
                </div>
              )}
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="about-gallery-rows" stagger={0.15}>
            {rows.map((rowImages, rowIndex) => {
              /* globalIndices: original image index for overlay (so repeated tiles open correct photo) */
              const globalIndices = rowImages.map((_, j) => (rowIndex + j * ROW_COUNT) % images.length);
              return (
                <StaggerItem key={rowIndex}>
                  <GalleryRow
                    images={rowImages}
                    globalIndices={globalIndices}
                    onImageClick={openOverlay}
                    onScrollAll={rowIndex === 1 ? scrollAllRows : undefined}
                    scrollRef={scrollRefs[rowIndex]}
                    showArrows={rowIndex === 1}
                    syncScrollRows
                  />
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>
      {overlayIndex !== null && (
        <GalleryOverlay
          images={images}
          currentIndex={overlayIndex}
          onClose={closeOverlay}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  );
}

type GalleryRowProps = {
  images: NormalizedGalleryImage[];
  globalIndices: number[];
  onImageClick: (index: number) => void;
  onScrollAll?: (dir: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  showArrows: boolean;
  /** When true, parent owns infinite scroll + cross-row sync; row only handles wheel → page scroll. */
  syncScrollRows?: boolean;
};

function GalleryRow({
  images,
  globalIndices,
  onImageClick,
  onScrollAll,
  scrollRef,
  showArrows,
  syncScrollRows = false,
}: GalleryRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isJumpingRef = useRef(false);

  const scroll = useCallback(
    (dir: number) => {
      if (onScrollAll) {
        onScrollAll(dir);
      } else {
        scrollRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: "smooth" });
      }
    },
    [onScrollAll, scrollRef]
  );

  useEffect(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track || !images.length) return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absX > absY || e.shiftKey) {
        return;
      }

      e.preventDefault();
      window.scrollBy({ top: e.deltaY, left: 0 });
    };

    if (syncScrollRows) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        el.removeEventListener("wheel", handleWheel);
      };
    }

    const totalWidth = track.scrollWidth;
    const copyWidth = totalWidth / ROW_COPIES;
    const maxScroll = totalWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    el.scrollLeft = copyWidth;

    const handleScroll = () => {
      if (isJumpingRef.current) return;
      const left = el.scrollLeft;
      if (left >= copyWidth * 2 - SCROLL_JUMP_THRESHOLD) {
        isJumpingRef.current = true;
        el.scrollLeft = left - copyWidth;
        requestAnimationFrame(() => { isJumpingRef.current = false; });
      } else if (left <= SCROLL_JUMP_THRESHOLD) {
        isJumpingRef.current = true;
        el.scrollLeft = left + copyWidth;
        requestAnimationFrame(() => { isJumpingRef.current = false; });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [images.length, scrollRef, syncScrollRows]);

  if (!images.length) return null;

  const duplicated = Array.from({ length: ROW_COPIES }, () => images).flat();
  const duplicatedIndices = Array.from({ length: ROW_COPIES }, () => globalIndices).flat();

  return (
    <div className="about-gallery-row">
      <div className="about-gallery-row-fade about-gallery-row-fade--left" aria-hidden />
      {showArrows && (
        <button
          type="button"
          className="about-gallery-arrow about-gallery-arrow--left"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
        />
      )}
      <div
        className={`about-gallery-row-scroll${syncScrollRows ? " about-gallery-row-scroll--marquee-sync" : ""}`}
        ref={scrollRef}
      >
        <div className="about-gallery-row-track" ref={trackRef}>
          {duplicated.map((src, i) => (
            <button
              key={`${duplicatedIndices[i]}-${i}`}
              type="button"
              className="about-gallery-item"
              onClick={() => onImageClick(duplicatedIndices[i])}
              aria-label="View image fullscreen"
            >
              <img src={src.thumbnailUrl || src.fullSizeUrl} alt={src.caption ?? ""} loading="lazy" draggable={false} decoding="async" />
            </button>
          ))}
        </div>
      </div>
      {showArrows && (
        <button
          type="button"
          className="about-gallery-arrow about-gallery-arrow--right"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
        />
      )}
      <div className="about-gallery-row-fade about-gallery-row-fade--right" aria-hidden />
    </div>
  );
}

type GalleryOverlayProps = {
  images: NormalizedGalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function GalleryOverlay({ images, currentIndex, onClose, onPrev, onNext }: GalleryOverlayProps) {
  const { swipeHandlers } = useGalleryPointerSwipe(onPrev, onNext, { disabled: images.length < 2 });
  const resolved = images.length ? (images[currentIndex] ?? images[0]) : null;
  const srcKey = resolved ? `${currentIndex}-${resolved.previewUrl || resolved.fullSizeUrl}` : "";
  const { imgStyle, onImageLoad } = useLightboxIntrinsicCssVars(srcKey);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!images.length || !resolved) return null;

  const overlay = (
    <div
      className="about-gallery-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery fullscreen"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        type="button"
        className="about-gallery-overlay-close"
        onClick={onClose}
        aria-label="Close"
      >
        <Icon name="close" size={24} />
      </button>
      <button
        type="button"
        className="about-gallery-overlay-arrow about-gallery-overlay-arrow--left"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
      >
        <span aria-hidden>‹</span>
      </button>
      <div
        className="about-gallery-overlay-image-wrap"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        <img
          src={resolved.previewUrl || resolved.fullSizeUrl}
          alt=""
          className="about-gallery-overlay-image"
          draggable={false}
          style={imgStyle}
          onLoad={onImageLoad}
        />
      </div>
      <button
        type="button"
        className="about-gallery-overlay-arrow about-gallery-overlay-arrow--right"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next image"
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(overlay, document.body)
    : overlay;
}

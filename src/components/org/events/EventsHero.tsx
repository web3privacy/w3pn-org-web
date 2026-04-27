"use client";

import type { CSSProperties, TransitionEvent } from "react";
import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { GalleryOverlay } from "@/components/org/AboutGallery";
import { useGalleryPointerSwipe } from "@/hooks/use-gallery-pointer-swipe";

type HeroMetric = { value?: string; label?: string };

type Hero = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  galleryImages?: string[];
  eyeImageUrl?: string;
  backgroundImage?: string;
  /** Optional stats row under hero description (events listing only). */
  metrics?: HeroMetric[];
};

const ITEMS_PER_ROW_DESKTOP = 6;
/** Viewport width ≤ this uses viewport-based visible slots (not desktop 6). */
const TABLET_GALLERY_VIEWPORT_MAX_PX = 1024;
/** Inclusive band where the strip shows 7.5 thumbs (peek of the next). */
const DESKTOP_GALLERY_SLOTS_7_5_MIN_PX = 1920;
const DESKTOP_GALLERY_SLOTS_7_5_MAX_PX = 2560;

const defaultGalleryImages = [
  "/images/events/page/assets/gallery/gallery-1.webp",
  "/images/events/page/assets/gallery/gallery-2.webp",
  "/images/events/page/assets/gallery/gallery-3.webp",
  "/images/events/page/assets/gallery/gallery-4.webp",
  "/images/events/page/assets/gallery/gallery-5.webp",
  "/images/events/page/assets/gallery/gallery-6.webp",
  "/images/events/page/assets/gallery/gallery-7.webp",
  "/images/events/page/assets/gallery/gallery-8.webp",
];

const BG_SWAP_MS = 10000;
const BG_TRANSITION_MS = 900;
/** Number of CSS `data-swap-mode` variants in global.css (0..COUNT-1); picked at random each swap */
const BG_SWAP_MODE_COUNT = 6;

/**
 * Track width is `(loopLen / galleryVisibleSlots) * 100%` of the gallery; CSS `--events-hero-gallery-item-w`
 * matches that layout. `galleryVisibleSlots` may be fractional (e.g. 3.5, 7.5 on 1920–2560px desktop).
 */

/** Visible “slots” for viewport width below 768px (fractional = peek of next thumb). */
function narrowViewportGallerySlots(viewportWidth: number): number {
  if (viewportWidth < 360) return 2.5;
  if (viewportWidth < 512) return 3;
  if (viewportWidth < 640) return 3.5;
  return 4.5;
}

function buildCycleUrls(galleryImages: string[] | undefined, backgroundImage: string | undefined): string[] {
  const fallbackBg = "/images/events/page/shared/event-bg.webp";
  const bg = (backgroundImage && String(backgroundImage).trim()) || fallbackBg;
  const gallery =
    Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages.map(String) : defaultGalleryImages;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [bg, ...gallery]) {
    const s = u.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out.length > 0 ? out : [fallbackBg];
}

export function EventsHero({ hero }: { hero: Hero | null | undefined }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [galleryInstant, setGalleryInstant] = useState(false);
  const [galleryVisibleSlots, setGalleryVisibleSlots] = useState(ITEMS_PER_ROW_DESKTOP);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [bgVisibleIdx, setBgVisibleIdx] = useState(0);
  const [bgTopLayer, setBgTopLayer] = useState<0 | 1>(0);
  const [bgSwapping, setBgSwapping] = useState(false);
  const [bgSwapMode, setBgSwapMode] = useState(0);
  const bgSwapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const galleryImages = hero?.galleryImages;
  const backgroundImage = hero?.backgroundImage;

  const cycleUrls = useMemo(
    () => buildCycleUrls(galleryImages as string[] | undefined, backgroundImage as string | undefined),
    [galleryImages, backgroundImage]
  );

  const images = useMemo(() => {
    const g =
      Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages.map(String) : defaultGalleryImages;
    const seen = new Set<string>();
    const strip: string[] = [];
    for (const u of g) {
      const s = u.trim();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      strip.push(s);
    }
    const bg = (backgroundImage && String(backgroundImage).trim()) || "/images/events/page/shared/event-bg.webp";
    if (bg && !seen.has(bg)) strip.unshift(bg);
    return strip.length > 0 ? strip : defaultGalleryImages;
  }, [galleryImages, backgroundImage]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;

    const sync = () => {
      const vw = window.innerWidth;
      if (vw < 768) {
        setGalleryVisibleSlots(narrowViewportGallerySlots(vw));
        return;
      }
      if (vw <= TABLET_GALLERY_VIEWPORT_MAX_PX) {
        setGalleryVisibleSlots(5);
        return;
      }
      if (vw >= DESKTOP_GALLERY_SLOTS_7_5_MIN_PX && vw <= DESKTOP_GALLERY_SLOTS_7_5_MAX_PX) {
        setGalleryVisibleSlots(7.5);
        return;
      }
      setGalleryVisibleSlots(ITEMS_PER_ROW_DESKTOP);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [galleryImages, backgroundImage]);

  const totalSlides = images.length;
  const loopImages = useMemo(() => (totalSlides > 0 ? [...images, ...images] : []), [images, totalSlides]);
  const loopLen = loopImages.length;
  const slotsCeil = Math.ceil(galleryVisibleSlots);
  const maxSlide = Math.max(0, loopLen - slotsCeil);
  const boundedSlideIndex = Math.min(Math.max(0, slideIndex), maxSlide);

  const slideRef = useRef(0);
  const instantRef = useRef(false);

  useEffect(() => {
    slideRef.current = boundedSlideIndex;
  }, [boundedSlideIndex]);

  const goPrev = useCallback(() => {
    const i = slideRef.current;
    if (i > 0) {
      setSlideIndex(i - 1);
      return;
    }
    if (maxSlide <= 0) return;
    instantRef.current = true;
    setGalleryInstant(true);
    setSlideIndex(maxSlide);
    requestAnimationFrame(() => {
      setGalleryInstant(false);
      setSlideIndex(maxSlide - 1);
      instantRef.current = false;
    });
  }, [maxSlide]);

  const goNext = useCallback(() => {
    const i = slideRef.current;
    if (i < maxSlide) {
      setSlideIndex(i + 1);
      return;
    }
    if (maxSlide <= 0) return;
    instantRef.current = true;
    setGalleryInstant(true);
    setSlideIndex(0);
    requestAnimationFrame(() => {
      setGalleryInstant(false);
      instantRef.current = false;
    });
  }, [maxSlide]);

  const { swipeHandlers } = useGalleryPointerSwipe(goPrev, goNext, { disabled: totalSlides === 0 });

  const onGalleryTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
      if (instantRef.current || totalSlides <= 0) return;
      const i = slideRef.current;
      if (i === totalSlides) {
        instantRef.current = true;
        setGalleryInstant(true);
        setSlideIndex(0);
        requestAnimationFrame(() => {
          setGalleryInstant(false);
          instantRef.current = false;
        });
      }
    },
    [totalSlides]
  );

  const nCycle = cycleUrls.length;

  useEffect(() => {
    if (nCycle < 2) return undefined;
    const id = window.setInterval(() => {
      setBgSwapMode(Math.floor(Math.random() * BG_SWAP_MODE_COUNT));
      setBgSwapping(true);
    }, BG_SWAP_MS);
    return () => window.clearInterval(id);
  }, [nCycle]);

  useEffect(() => {
    if (!bgSwapping) {
      if (bgSwapTimerRef.current) {
        clearTimeout(bgSwapTimerRef.current);
        bgSwapTimerRef.current = null;
      }
      return undefined;
    }
    if (bgSwapTimerRef.current) clearTimeout(bgSwapTimerRef.current);
    bgSwapTimerRef.current = setTimeout(() => {
      bgSwapTimerRef.current = null;
      setBgVisibleIdx((v) => (v + 1) % Math.max(1, nCycle));
      setBgTopLayer((t) => (t === 0 ? 1 : 0));
      setBgSwapping(false);
    }, BG_TRANSITION_MS);
    return () => {
      if (bgSwapTimerRef.current) {
        clearTimeout(bgSwapTimerRef.current);
        bgSwapTimerRef.current = null;
      }
    };
  }, [bgSwapping, nCycle]);

  if (!hero) return null;

  const { title, description, metrics } = hero;
  const metricItems = (Array.isArray(metrics) ? metrics : []).filter(
    (m) => m && (String(m.value ?? "").trim() || String(m.label ?? "").trim())
  );

  const src0 =
    nCycle > 0
      ? cycleUrls[bgTopLayer === 0 ? bgVisibleIdx % nCycle : (bgVisibleIdx + 1) % nCycle]
      : "/images/events/page/shared/event-bg.webp";
  const src1 =
    nCycle > 0
      ? cycleUrls[bgTopLayer === 1 ? bgVisibleIdx % nCycle : (bgVisibleIdx + 1) % nCycle]
      : "/images/events/page/shared/event-bg.webp";

  return (
    <>
      <section className="events-hero hero">
        <div
          className="events-hero-bg-stack"
          data-swapping={bgSwapping ? "true" : "false"}
          data-swap-mode={bgSwapping ? String(bgSwapMode) : undefined}
          data-top-layer={String(bgTopLayer)}
        >
          <img className="events-hero-bg-layer events-hero-bg-layer--0" src={src0} alt="" />
          <img className="events-hero-bg-layer events-hero-bg-layer--1" src={src1} alt="" />
          <div className="events-hero-bg-fx" aria-hidden />
        </div>
        <div className="events-hero-bg-darkening" aria-hidden />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>{title}</h1>
          {description && <p className="events-hero-desc">{description}</p>}
          {metricItems.length > 0 && (
            <div className="events-hero-metrics" aria-label="Event program highlights">
              {metricItems.map((m, i) => (
                <div key={`${m.label}-${i}`} className="events-hero-metrics-item">
                  {m.value != null && String(m.value).trim() !== "" && (
                    <span className="events-hero-metrics-value">{m.value}</span>
                  )}
                  {m.label != null && String(m.label).trim() !== "" && (
                    <span className="events-hero-metrics-label">{m.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {images.length > 0 && (
          <div className="events-hero-gallery-wrap">
            <button
              type="button"
              className="events-hero-gallery-arrow events-hero-gallery-arrow-prev"
              aria-label="Previous images"
              onClick={goPrev}
              disabled={totalSlides === 0}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <div ref={galleryRef} className="events-hero-gallery" {...swipeHandlers}>
              <div
                className={`events-hero-gallery-track${galleryInstant ? " events-hero-gallery-track--instant" : ""}`}
                onTransitionEnd={onGalleryTransitionEnd}
                style={{
                  ...(loopLen > 0
                    ? ({ "--loop-len": String(loopLen) } as CSSProperties)
                    : undefined),
                  width: loopLen > 0 ? `${(loopLen / galleryVisibleSlots) * 100}%` : "100%",
                  transform:
                    loopLen > 0 ? `translateX(-${(boundedSlideIndex * 100) / loopLen}%)` : "none",
                }}
              >
                {loopImages.map((src, i) => (
                  <button
                    key={`${i}-${src}`}
                    type="button"
                    className="events-hero-gallery-item"
                    onClick={() => setLightboxIndex(i % totalSlides)}
                    aria-label="View image fullscreen"
                  >
                    <img src={src} alt="" loading={i < slotsCeil ? "eager" : "lazy"} />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="events-hero-gallery-arrow events-hero-gallery-arrow-next"
              aria-label="Next images"
              onClick={goNext}
              disabled={totalSlides === 0}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>
        )}
      </section>
      {lightboxIndex !== null && (
        <GalleryOverlay
          images={images.map((src) => ({ thumbnailUrl: src, previewUrl: src, fullSizeUrl: src }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))}
          onNext={() => setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))}
        />
      )}
    </>
  );
}

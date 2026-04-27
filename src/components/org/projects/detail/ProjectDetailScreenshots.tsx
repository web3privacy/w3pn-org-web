"use client";

import { useCallback, useMemo, useState } from "react";
import { GalleryOverlay } from "@/components/org/AboutGallery";
import { orgAsset } from "./ProjectDetailLayout";

type Screenshot = {
  src?: string;
  thumbnailSrc?: string;
  previewSrc?: string;
  alt?: string;
  caption?: string;
};

type Props = {
  screenshots?: Screenshot[];
  /** When true, render inner grid only (no outer section) for embedding in mission/links layout. */
  embedded?: boolean;
};

type NormalizedScreenshot = {
  thumbnailUrl: string;
  previewUrl: string;
  fullSizeUrl: string;
  alt: string;
  caption?: string;
};

function ProjectDetailScreenshotCard({
  shot,
  index,
  onOpen,
}: {
  shot: Screenshot;
  index: number;
  onOpen: (index: number) => void;
}) {
  const captionText = shot.caption?.trim() || shot.alt?.trim() || "";
  return (
    <div className="project-detail-screenshot-card">
      <button
        type="button"
        className="project-detail-screenshot-trigger"
        onClick={() => onOpen(index)}
        aria-label={captionText ? `Open screenshot: ${captionText}` : "Open screenshot preview"}
      >
        <div className="project-detail-screenshot-img-wrap">
          <img
            src={orgAsset(shot.thumbnailSrc ?? shot.previewSrc ?? shot.src)}
            alt={shot.alt ?? ""}
            loading="lazy"
          />
        </div>
      </button>
      {captionText ? <p className="project-detail-screenshot-caption">{captionText}</p> : null}
    </div>
  );
}

function PlaceholderImage({ index }: { index: number }) {
  const hues = [160, 200, 260];
  const hue = hues[index % hues.length];
  return (
    <div
      className="project-detail-screenshot-placeholder"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 15%, 12%) 0%, hsl(${hue}, 10%, 8%) 100%)`,
      }}
      aria-hidden
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
        <circle cx="17" cy="22" r="3.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
        <path d="M6 32l10-8 6 5 8-10 12 13" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </svg>
      <span style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Screenshot {index + 1}
      </span>
    </div>
  );
}

export function ProjectDetailScreenshots({ screenshots, embedded }: Props) {
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);
  const hasReal = screenshots && screenshots.length > 0;
  const placeholderCount = 3;
  const visibleShots = hasReal ? screenshots : Array.from({ length: placeholderCount }, (_, i) => ({ key: i }));
  const normalizedShots = useMemo<NormalizedScreenshot[]>(() => {
    return (screenshots ?? []).flatMap((shot) => {
      const fullSizeUrl = orgAsset(shot.src ?? shot.previewSrc ?? shot.thumbnailSrc);
      const previewUrl = orgAsset(shot.previewSrc ?? shot.src ?? shot.thumbnailSrc);
      const thumbnailUrl = orgAsset(shot.thumbnailSrc ?? shot.previewSrc ?? shot.src);
      if (!fullSizeUrl) return [];
      const row: NormalizedScreenshot = {
        thumbnailUrl: thumbnailUrl || previewUrl || fullSizeUrl,
        previewUrl: previewUrl || fullSizeUrl,
        fullSizeUrl,
        alt: shot.alt ?? "",
        caption: shot.caption,
      };
      return [row];
    });
  }, [screenshots]);
  const openOverlay = useCallback((index: number) => setOverlayIndex(index), []);
  const closeOverlay = useCallback(() => setOverlayIndex(null), []);
  const goPrev = useCallback(
    () => setOverlayIndex((prev) => (prev === null ? null : (prev - 1 + normalizedShots.length) % normalizedShots.length)),
    [normalizedShots.length],
  );
  const goNext = useCallback(
    () => setOverlayIndex((prev) => (prev === null ? null : (prev + 1) % normalizedShots.length)),
    [normalizedShots.length],
  );

  const grid = (
    <div className="project-detail-screenshots-grid">
      {visibleShots.map((s, i) => {
        const isDesktopOnly = hasReal && i >= 3;
        const content = hasReal ? (
          <ProjectDetailScreenshotCard shot={s as Screenshot} index={i} onOpen={openOverlay} />
        ) : (
          <div className="project-detail-screenshot-card">
            <PlaceholderImage index={i} />
          </div>
        );

        return (
          <div key={i} className={`project-detail-screenshot-cell${isDesktopOnly ? " project-detail-screenshot-cell--desktop-only" : ""}`}>
            {content}
          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <>
        <div className="project-detail-screenshots-section project-detail-screenshots-section--embedded">{grid}</div>
        {overlayIndex !== null && normalizedShots.length > 0 && (
          <GalleryOverlay
            images={normalizedShots}
            currentIndex={overlayIndex}
            onClose={closeOverlay}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section className="event-detail-section project-detail-section project-detail-screenshots-section">
        {grid}
      </section>
      {overlayIndex !== null && normalizedShots.length > 0 && (
        <GalleryOverlay
          images={normalizedShots}
          currentIndex={overlayIndex}
          onClose={closeOverlay}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  );
}

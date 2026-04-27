"use client";

import { useEffect, useState } from "react";

/** Match project-detail narrow layout (e.g. highlights column-gap tweak). */
export const PROJECT_DETAIL_VIDEOS_COLLAPSE_MEDIA = "(max-width: 512px)";
/** Visible talk cards before “Show all videos” on narrow viewports. */
export const PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT = 3;

/**
 * On viewports matching {@link PROJECT_DETAIL_VIDEOS_COLLAPSE_MEDIA}, returns
 * {@link PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT}; otherwise `Infinity` (show all).
 */
export function useProjectDetailVideosCollapsedLimit(): number {
  const [limit, setLimit] = useState(Number.POSITIVE_INFINITY);

  useEffect(() => {
    const mq = window.matchMedia(PROJECT_DETAIL_VIDEOS_COLLAPSE_MEDIA);
    const sync = () => {
      setLimit(mq.matches ? PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT : Number.POSITIVE_INFINITY);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return limit;
}

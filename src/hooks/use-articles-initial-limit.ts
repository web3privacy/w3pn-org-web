"use client";

import { useEffect, useState } from "react";
import { ARTICLES_COLLAPSE_MEDIA, ARTICLES_COLLAPSE_LIMIT_NARROW, ARTICLES_COLLAPSE_LIMIT_WIDE } from "@/lib/org/article-list-collapse";

/**
 * Initial number of article cards to show before "Show all articles".
 * 4 on desktop/tablet, 3 on viewports matching {@link ARTICLES_COLLAPSE_MEDIA}.
 */
export function useArticlesInitialLimit(): number {
  const [limit, setLimit] = useState(ARTICLES_COLLAPSE_LIMIT_WIDE);

  useEffect(() => {
    const mq = window.matchMedia(ARTICLES_COLLAPSE_MEDIA);
    const sync = () => {
      setLimit(mq.matches ? ARTICLES_COLLAPSE_LIMIT_NARROW : ARTICLES_COLLAPSE_LIMIT_WIDE);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return limit;
}

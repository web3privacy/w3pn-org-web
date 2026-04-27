"use client";

export const EVENTS_SCROLL_KEY = "w3pn:scroll:events";
export const PROJECTS_SCROLL_KEY = "w3pn:scroll:projects";

export function saveScrollPosition(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, String(window.scrollY));
  } catch {
    // Ignore storage failures in private mode or restricted contexts.
  }
}

function peekScrollY(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const y = Number(raw);
    if (!Number.isFinite(y) || y < 0) return null;
    return y;
  } catch {
    return null;
  }
}

function clearScrollY(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Scroll to the Y stored under `key` after the page has real height (not only
 * the loading skeleton). Retries on rAF so late layout/images do not leave the
 * viewport at the wrong offset. Only removes the key from sessionStorage once
 * the scroll has been applied close to the target (or max attempts).
 */
export function consumeScrollAfterLayout(key: string): void {
  if (typeof window === "undefined") return;
  const y = peekScrollY(key);
  if (y === null) return;

  let attempt = 0;
  const maxAttempts = 50;

  const step = () => {
    attempt++;
    const doc = document.documentElement;
    const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
    const clamped = Math.min(y, maxScroll);
    window.scrollTo({ top: clamped, behavior: "auto" });

    const close = Math.abs(window.scrollY - clamped) <= 2;
    if (close && attempt >= 2) {
      clearScrollY(key);
      return;
    }
    if (attempt >= maxAttempts) {
      clearScrollY(key);
      return;
    }
    requestAnimationFrame(step);
  };

  queueMicrotask(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(step);
    });
  });
}

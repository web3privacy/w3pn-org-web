"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Viewports where touch / pointer swipe should drive prev/next (desktop keeps arrows only). */
const SWIPE_MEDIA_QUERY = "(max-width: 1024px)";
const SWIPE_MIN_PX = 44;
/** Swipe must be more horizontal than vertical. */
const DIR_RATIO = 1.05;

type Options = {
  /** When true, hook reports disabled and attaches no behavior. */
  disabled?: boolean;
};

/**
 * Horizontal pointer-swipe (touch / pen) → prev/next.
 * Ignores mouse; uses pointer capture so lift outside the target still completes the swipe.
 */
export function useGalleryPointerSwipe(
  onPrev: () => void,
  onNext: () => void,
  options?: Options,
) {
  const disabled = options?.disabled ?? false;
  const [mediaSwipeEnabled, setMediaSwipeEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(SWIPE_MEDIA_QUERY).matches;
  });

  const activeId = useRef<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(SWIPE_MEDIA_QUERY);
    const apply = () => setMediaSwipeEnabled(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const swipeEnabled = mediaSwipeEnabled && !disabled;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!swipeEnabled || disabled) return;
      if (e.pointerType === "mouse") return;
      if (e.button !== 0) return;
      activeId.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [swipeEnabled, disabled],
  );

  const finishSwipe = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * DIR_RATIO) return;
    if (dx > 0) onPrev();
    else onNext();
  }, [onNext, onPrev]);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!swipeEnabled || disabled) return;
      if (e.pointerType === "mouse") return;
      if (activeId.current !== e.pointerId) return;
      activeId.current = null;
      finishSwipe(e.clientX, e.clientY);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [swipeEnabled, disabled, finishSwipe],
  );

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (activeId.current === e.pointerId) activeId.current = null;
  }, []);

  const swipeHandlers =
    swipeEnabled && !disabled
      ? {
          onPointerDown,
          onPointerUp,
          onPointerCancel,
        }
      : {};

  return { swipeEnabled, swipeHandlers };
}

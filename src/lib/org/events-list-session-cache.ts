"use client";

const EVENTS_LIST_SESSION_KEY = "w3pn:events:list-session-cache";

export type EventsListSessionPayload = {
  v: 1;
  featuredKey: string;
  events: unknown[];
  details: Record<string, unknown>;
};

export function readEventsListSessionCache(featuredKey: string): {
  events: unknown[];
  details: Record<string, unknown>;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(EVENTS_LIST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventsListSessionPayload;
    if (parsed?.v !== 1 || parsed.featuredKey !== featuredKey) return null;
    if (!Array.isArray(parsed.events)) return null;
    return {
      events: parsed.events,
      details: parsed.details && typeof parsed.details === "object" ? parsed.details : {},
    };
  } catch {
    return null;
  }
}

export function writeEventsListSessionCache(
  featuredKey: string,
  events: unknown[],
  details: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: EventsListSessionPayload = {
      v: 1,
      featuredKey,
      events,
      details,
    };
    window.sessionStorage.setItem(EVENTS_LIST_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Quota, private mode, or disabled storage
  }
}

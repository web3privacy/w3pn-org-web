/**
 * Server-side: read events and details from data/events (index.yaml, details/*.yaml).
 * YAML is the only runtime source of truth for org events.
 */

import type { EventItem, EventDetail } from "./events-types";
import { loadEventsData } from "@/lib/events";
import { loadEventDetail } from "@/lib/event-details";

export type { EventItem, EventDetail } from "./events-types";

function loadFromYaml(): { events: EventItem[]; details: Record<string, EventDetail> } {
  try {
    const data = loadEventsData();
    const events = (data.events ?? []) as EventItem[];
    if (events.length === 0) return { events: [], details: {} };
    const details: Record<string, EventDetail> = {};
    for (const e of events) {
      const d = loadEventDetail(e.id);
      if (d) details[e.id] = d;
    }
    return { events, details };
  } catch {
    return { events: [], details: {} };
  }
}

function load(): { events: EventItem[]; details: Record<string, EventDetail> } {
  return loadFromYaml();
}

export function getEventsList(): EventItem[] {
  return load().events;
}

export function getEventById(eventId: string): EventItem | null {
  return load().events.find((e) => e.id === eventId) ?? null;
}

export function getEventDetailById(eventId: string): EventDetail | null {
  return load().details[eventId] ?? null;
}

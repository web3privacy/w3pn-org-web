/**
 * Loads event data from YAML files in data/events/. Merges base events (index.yaml)
 * with user overrides (events-user.yaml), then filters out hidden IDs (events-visibility.yaml).
 */

import path from "node:path";
import type { Event, EventsData } from "@/types/events";
import { getAppPackageRoot } from "@/lib/app-package-root";
import { getWritableDataPath } from "@/lib/runtime-paths";
import { loadYaml } from "@/lib/yaml-utils";

const ROOT_DIR = getAppPackageRoot();
const EVENTS_DIR = path.join(ROOT_DIR, "data", "events");
const INDEX_FILE = path.join(EVENTS_DIR, "index.yaml");
const USER_FILE = getWritableDataPath("events", "events-user.yaml");
const VISIBILITY_FILE = getWritableDataPath("events", "events-visibility.yaml");

function loadBaseEvents(): Event[] {
  const raw = loadYaml<Event[] | { events?: Event[] }>(INDEX_FILE, []);
  return (Array.isArray(raw) ? raw : raw.events ?? []) as Event[];
}

function loadUserEvents(): Event[] {
  const parsed = loadYaml<{ events?: Event[] }>(USER_FILE, {});
  return (parsed.events ?? []) as Event[];
}

function loadHiddenIds(): string[] {
  const parsed = loadYaml<{ hidden?: string[] }>(VISIBILITY_FILE, {});
  return parsed.hidden ?? [];
}

function mergeEvents(base: Event[], user: Event[]): Event[] {
  const map = new Map<string, Event>();
  base.forEach((e) => map.set(e.id, e));
  user.forEach((e) => map.set(e.id, e));
  return Array.from(map.values());
}

export function loadEventsData(): EventsData {
  const base = loadBaseEvents();
  const user = loadUserEvents();
  const hidden = loadHiddenIds();
  const merged = mergeEvents(base, user);
  const visible = merged.filter((e) => !hidden.includes(e.id));
  return { events: visible };
}

/** Returns all merged events (base + user) without hiding – for admin. */
export function loadAllEventsForAdmin(): Event[] {
  const base = loadBaseEvents();
  const user = loadUserEvents();
  return mergeEvents(base, user).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

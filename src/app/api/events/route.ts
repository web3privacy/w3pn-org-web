import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Event } from "@/types/events";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { AdminValidationError, parseEventBody } from "@/lib/admin-validation";
import { getAppPackageRoot } from "@/lib/app-package-root";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";
import { getWritableDataPath } from "@/lib/runtime-paths";

function readonlyGuard() {
  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      { error: "Write operations are disabled in production. Use local development to edit data." },
      { status: 403 }
    );
  }
  return null;
}

const DATA_DIR = path.join(getAppPackageRoot(), "data", "events");
const INDEX_FILE = path.join(DATA_DIR, "index.yaml");
const USER_FILE = getWritableDataPath("events", "events-user.yaml");
const VISIBILITY_FILE = getWritableDataPath("events", "events-visibility.yaml");

function loadYaml<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.load(content) as T | null;
  return parsed ?? fallback;
}

function loadBaseEvents(): Event[] {
  const raw = loadYaml<Event[] | { events?: Event[] }>(INDEX_FILE, []);
  return Array.isArray(raw) ? raw : (raw.events ?? []);
}

function loadUserEvents(): Event[] {
  const parsed = loadYaml<{ events?: Event[] }>(USER_FILE, {});
  return parsed.events ?? [];
}

function loadVisibility(): string[] {
  const parsed = loadYaml<{ hidden?: string[] }>(VISIBILITY_FILE, {});
  return parsed.hidden ?? [];
}

function saveUserEvents(events: Event[]) {
  if (!fs.existsSync(path.dirname(USER_FILE))) {
    fs.mkdirSync(path.dirname(USER_FILE), { recursive: true });
  }
  fs.writeFileSync(USER_FILE, yaml.dump({ events }), "utf8");
}

function saveVisibility(hidden: string[]) {
  if (!fs.existsSync(path.dirname(VISIBILITY_FILE))) {
    fs.mkdirSync(path.dirname(VISIBILITY_FILE), { recursive: true });
  }
  fs.writeFileSync(VISIBILITY_FILE, yaml.dump({ hidden }), "utf8");
}

function mergeEvents(base: Event[], user: Event[]): Event[] {
  const map = new Map<string, Event>();
  base.forEach((e) => map.set(e.id, e));
  user.forEach((e) => map.set(e.id, e));
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Public: returns visible events only.
 * `?admin=1` includes hidden flags (requires admin session when ADMIN_PASSWORD is set).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "1";
  if (admin) {
    const unauthorized = await adminUnauthorizedResponse(request);
    if (unauthorized) return unauthorized;
  }

  const base = loadBaseEvents();
  const user = loadUserEvents();
  const hidden = loadVisibility();
  const merged = mergeEvents(base, user);

  if (admin) {
    const res = NextResponse.json({
      events: merged.map((e) => ({
        ...e,
        hidden: hidden.includes(e.id),
      })),
      hidden,
    });
    return res;
  }

  const visible = merged.filter((e) => !hidden.includes(e.id));
  return NextResponse.json({ events: visible });
}

export async function POST(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const guard = readonlyGuard();
  if (guard) return guard;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let event: Event;
  try {
    event = parseEventBody(body, "create");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  const userEvents = loadUserEvents();
  userEvents.push(event);
  saveUserEvents(userEvents);
  await appendAdminAuditEntryFromRequest(request, {
    action: "events.create",
    target: `data/events/events-user.yaml#${event.id}`,
    summary: `Created event: ${event.id}`,
    details: {
      eventId: event.id,
      city: event.city,
      date: event.date,
      fields: Object.keys(body),
    },
  });
  return NextResponse.json({ ok: true, id: event.id });
}

export async function PUT(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const guard = readonlyGuard();
  if (guard) return guard;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let event: Event;
  try {
    event = parseEventBody(body, "update");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  const eventId = event.id;
  const userEvents = loadUserEvents();
  const idx = userEvents.findIndex((e) => e.id === eventId);
  if (idx >= 0) {
    userEvents[idx] = { ...userEvents[idx], ...event };
  } else {
    userEvents.push(event);
  }
  saveUserEvents(userEvents);
  await appendAdminAuditEntryFromRequest(request, {
    action: "events.update",
    target: `data/events/events-user.yaml#${eventId}`,
    summary: `Updated event: ${eventId}`,
    details: {
      eventId,
      fields: Object.keys(body),
      existed: idx >= 0,
    },
  });
  return NextResponse.json({ ok: true });
}

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { EventDetail } from "@/types/event-detail";
import { getReadableDataPath, getWritableDataPath } from "@/lib/runtime-paths";
import { loadYaml } from "@/lib/yaml-utils";

const WRITABLE_DETAILS_DIR = path.dirname(getWritableDataPath("events", "details", "placeholder"));

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, "");
}

export function loadEventDetail(eventId: string): EventDetail | null {
  const safe = sanitizeId(eventId);
  if (!safe) return null;
  const filePath = getReadableDataPath("events", "details", `${safe}.yaml`);
  const detail = loadYaml<EventDetail | null>(filePath, null);
  if (!detail || typeof detail !== "object") return null;
  return { ...detail, eventId: safe };
}

export function saveEventDetail(detail: EventDetail): void {
  const safe = sanitizeId(detail.eventId);
  if (!safe) throw new Error("Invalid event ID");
  if (!fs.existsSync(WRITABLE_DETAILS_DIR)) {
    fs.mkdirSync(WRITABLE_DETAILS_DIR, { recursive: true });
  }
  const filePath = path.join(WRITABLE_DETAILS_DIR, `${safe}.yaml`);
  const toSave = { ...detail };
  delete (toSave as Record<string, unknown>).eventId;
  fs.writeFileSync(filePath, yaml.dump(toSave), "utf8");
}

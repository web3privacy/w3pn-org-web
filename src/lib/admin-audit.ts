import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getClientIpFromRequest } from "@/lib/admin-rate-limit";
import { readAdminSessionFromRequest } from "@/lib/admin-api";
import { getWritableDataPath } from "@/lib/runtime-paths";

export type AdminAuditEntry = {
  id: string;
  timestamp: string;
  actorName: string;
  ip: string;
  action: string;
  route: string;
  target?: string;
  summary: string;
  details?: Record<string, unknown>;
};

const AUDIT_DIR = path.dirname(getWritableDataPath("admin", "audit-log.jsonl"));
export const ADMIN_AUDIT_LOG_FILE = path.join(AUDIT_DIR, "audit-log.jsonl");

function ensureAuditDir(): void {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

function parseAuditLine(line: string): AdminAuditEntry | null {
  if (!line.trim()) return null;
  try {
    const parsed = JSON.parse(line) as AdminAuditEntry;
    if (!parsed?.id || !parsed?.timestamp || !parsed?.actorName || !parsed?.action || !parsed?.route) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readAdminAuditEntries(limit = 200): AdminAuditEntry[] {
  try {
    if (!fs.existsSync(ADMIN_AUDIT_LOG_FILE)) return [];
    const raw = fs.readFileSync(ADMIN_AUDIT_LOG_FILE, "utf8");
    const entries = raw
      .split(/\r?\n/)
      .map(parseAuditLine)
      .filter((entry): entry is AdminAuditEntry => Boolean(entry));
    return entries.slice(-limit).reverse();
  } catch {
    return [];
  }
}

export function appendAdminAuditEntry(
  entry: Omit<AdminAuditEntry, "id" | "timestamp">
): AdminAuditEntry | null {
  try {
    ensureAuditDir();
    const fullEntry: AdminAuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    fs.appendFileSync(ADMIN_AUDIT_LOG_FILE, `${JSON.stringify(fullEntry)}\n`, "utf8");
    return fullEntry;
  } catch {
    return null;
  }
}

export async function appendAdminAuditEntryFromRequest(
  request: Request,
  entry: Omit<AdminAuditEntry, "id" | "timestamp" | "actorName" | "ip" | "route">
): Promise<AdminAuditEntry | null> {
  const session = await readAdminSessionFromRequest(request);
  return appendAdminAuditEntry({
    actorName: session?.displayName ?? "Unknown",
    ip: getClientIpFromRequest(request),
    route: new URL(request.url).pathname,
    ...entry,
  });
}

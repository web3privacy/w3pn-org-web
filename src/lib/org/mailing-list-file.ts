import fs from "node:fs";
import path from "node:path";
import { getWritableDataPath } from "@/lib/runtime-paths";

export const MAILING_LIST_FILE = getWritableDataPath("org", "mailing-list.json");

export type MailingListSubscriber = {
  email: string;
  subscribedAt: string;
};

type FileShape = {
  subscribers: MailingListSubscriber[];
};

function emptyShape(): FileShape {
  return { subscribers: [] };
}

function parseFile(raw: string): FileShape {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || !Array.isArray((data as FileShape).subscribers)) {
      return emptyShape();
    }
    return {
      subscribers: ((data as FileShape).subscribers ?? [])
        .filter((s): s is MailingListSubscriber => {
          return (
            s != null &&
            typeof s === "object" &&
            typeof (s as MailingListSubscriber).email === "string" &&
            typeof (s as MailingListSubscriber).subscribedAt === "string"
          );
        })
        .map((s) => ({
          email: String(s.email).trim().toLowerCase(),
          subscribedAt: s.subscribedAt,
        })),
    };
  } catch {
    return emptyShape();
  }
}

export function readMailingList(): MailingListSubscriber[] {
  try {
    if (!fs.existsSync(MAILING_LIST_FILE)) return [];
    const raw = fs.readFileSync(MAILING_LIST_FILE, "utf8");
    const { subscribers } = parseFile(raw);
    return [...subscribers].sort((a, b) => (a.subscribedAt < b.subscribedAt ? 1 : a.subscribedAt > b.subscribedAt ? -1 : 0));
  } catch {
    return [];
  }
}

function writeMailingList(subscribers: MailingListSubscriber[]): void {
  const dir = path.dirname(MAILING_LIST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const payload: FileShape = { subscribers };
  const tmp = `${MAILING_LIST_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, MAILING_LIST_FILE);
}

/**
 * Adds email if not already present (case-insensitive). Returns whether it was newly added.
 */
export function appendMailingListSubscriber(email: string): { added: boolean } {
  const normalized = email.trim().toLowerCase();
  const list = readMailingList();
  if (list.some((s) => s.email === normalized)) {
    return { added: false };
  }
  const next: MailingListSubscriber[] = [
    { email: normalized, subscribedAt: new Date().toISOString() },
    ...list,
  ];
  writeMailingList(next);
  return { added: true };
}

export function removeMailingListSubscriber(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const list = readMailingList();
  const filtered = list.filter((s) => s.email !== normalized);
  if (filtered.length === list.length) return false;
  writeMailingList(filtered);
  return true;
}

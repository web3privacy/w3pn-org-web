/**
 * Timing-safe password check for admin login (Node route handlers only).
 * Compares SHA-256 digests so length differences do not short-circuit.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { ensureEnvLoaded } from "@/lib/ensure-env";

export function verifyAdminPassword(candidate: string): boolean {
  ensureEnvLoaded();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length === 0) return false;
  try {
    const a = createHash("sha256").update(candidate, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

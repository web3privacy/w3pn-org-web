import { headers } from "next/headers";

type AttemptState = {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, AttemptState>();

function extractClientIp(getHeader: (name: string) => string | null): string {
  const forwardedFor = getHeader("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = getHeader("x-real-ip") ?? getHeader("cf-connecting-ip");
  return realIp?.trim() || "unknown";
}

function getAttemptKey(ip: string): string {
  return `admin-login:${ip}`;
}

function now(): number {
  return Date.now();
}

function getState(key: string): AttemptState | null {
  const state = attempts.get(key);
  if (!state) return null;

  const ts = now();
  if (state.lockedUntil > 0 && state.lockedUntil > ts) return state;
  if (state.lockedUntil > 0 && state.lockedUntil <= ts) {
    attempts.delete(key);
    return null;
  }
  if (ts - state.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return null;
  }
  return state;
}

export async function getClientIpFromNextHeaders(): Promise<string> {
  const headerStore = await headers();
  return extractClientIp((name) => headerStore.get(name));
}

export function getClientIpFromRequest(request: Request): string {
  return extractClientIp((name) => request.headers.get(name));
}

export function checkAdminLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const state = getState(getAttemptKey(ip));
  if (!state) return { allowed: true, retryAfterSec: 0 };
  if (state.lockedUntil > 0) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((state.lockedUntil - now()) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordAdminLoginFailure(ip: string): { allowed: boolean; retryAfterSec: number } {
  const key = getAttemptKey(ip);
  const ts = now();
  const existing = getState(key);

  if (!existing) {
    attempts.set(key, {
      count: 1,
      firstAttemptAt: ts,
      lockedUntil: 0,
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  const nextCount = existing.count + 1;
  if (nextCount >= MAX_ATTEMPTS) {
    const lockedUntil = ts + LOCK_MS;
    attempts.set(key, {
      count: nextCount,
      firstAttemptAt: existing.firstAttemptAt,
      lockedUntil,
    });
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((lockedUntil - ts) / 1000)),
    };
  }

  attempts.set(key, {
    ...existing,
    count: nextCount,
  });
  return { allowed: true, retryAfterSec: 0 };
}

export function clearAdminLoginRateLimit(ip: string): void {
  attempts.delete(getAttemptKey(ip));
}

/**
 * Signed admin session token (HMAC-SHA256) for cookie auth.
 * Uses Web Crypto so the same code runs in Edge middleware and Node route handlers.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export type AdminAuthConfigError = "missing_password" | "missing_session_secret";

export function getAdminAuthConfigError(): AdminAuthConfigError | null {
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
  const hasSessionSecret = Boolean(
    process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length > 0
  );
  if (!hasPassword) return "missing_password";
  if (!hasSessionSecret) return "missing_session_secret";
  return null;
}

export function getAdminAuthConfigErrorMessage(error: AdminAuthConfigError): string {
  if (error === "missing_password") {
    return "Admin auth is disabled because ADMIN_PASSWORD is not set.";
  }
  return "Admin auth is misconfigured because ADMIN_SESSION_SECRET is not set.";
}

/** Used to HMAC-sign the admin session cookie. Must be independent from the login password. */
export function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export function isAdminAuthConfigured(): boolean {
  return getAdminAuthConfigError() === null;
}

export type AdminSessionPayload = {
  exp: number;
  displayName: string | null;
};

function toBase64UrlUtf8(value: string): string {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlUtf8(value: string): string | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

export function normalizeAdminActorName(input: string): string {
  const normalized = input.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return normalized.slice(0, 80);
}

function parseAdminSessionToken(token: string): { expStr: string; namePart: string; sig: string } | null {
  const parts = token.split(".");
  if (parts.length === 2) {
    const [expStr, sig] = parts;
    if (!expStr || !sig) return null;
    return { expStr, namePart: "", sig };
  }
  if (parts.length === 3) {
    const [expStr, namePart, sig] = parts;
    if (!expStr || !sig) return null;
    return { expStr, namePart, sig };
  }
  return null;
}

/** Cookie value: `${expMs}.${base64url(name)}.${hexHmac}` */
export async function createAdminSessionToken(
  secret: string,
  ttlMs: number,
  displayName?: string | null
): Promise<string> {
  const exp = Date.now() + ttlMs;
  const expStr = String(exp);
  const safeName = normalizeAdminActorName(displayName ?? "") || "Unknown";
  const namePart = toBase64UrlUtf8(safeName);
  const message = `${expStr}.${namePart}`;
  const sig = await hmacSha256Hex(secret, message);
  return `${message}.${sig}`;
}

export async function verifyAdminSessionToken(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const parsed = parseAdminSessionToken(token);
  if (!parsed) return false;
  const { expStr, namePart, sig } = parsed;
  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Date.now()) return false;
  const message = namePart ? `${expStr}.${namePart}` : expStr;
  const expected = await hmacSha256Hex(secret, message);
  return timingSafeEqualHex(sig, expected);
}

export async function readAdminSessionPayload(
  token: string,
  secret: string
): Promise<AdminSessionPayload | null> {
  if (!(await verifyAdminSessionToken(token, secret))) return null;
  const parsed = parseAdminSessionToken(token);
  if (!parsed) return null;
  const exp = parseInt(parsed.expStr, 10);
  if (Number.isNaN(exp)) return null;
  const displayName = parsed.namePart ? normalizeAdminActorName(fromBase64UrlUtf8(parsed.namePart) ?? "") : "";
  return {
    exp,
    displayName: displayName || null,
  };
}

export const ADMIN_SESSION_COOKIE = "w3pn_admin";
export const ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

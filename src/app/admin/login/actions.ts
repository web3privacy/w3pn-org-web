"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appendAdminAuditEntry } from "@/lib/admin-audit";
import { shouldUseSecureCookieFromRequestHeaders } from "@/lib/admin-api";
import { ensureEnvLoaded } from "@/lib/ensure-env";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginRateLimit,
  getClientIpFromNextHeaders,
  recordAdminLoginFailure,
} from "@/lib/admin-rate-limit";
import { verifyAdminPassword } from "@/lib/admin-auth-password";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  createAdminSessionToken,
  getAdminAuthConfigError,
  getAdminSessionSecret,
  normalizeAdminActorName,
} from "@/lib/admin-session";

function pickNextFromFormData(formData: FormData): string {
  const raw = formData.get("next");
  const s = typeof raw === "string" ? raw : "/admin";
  if (!s.startsWith("/") || s.startsWith("//")) return "/admin";
  return s;
}

export async function loginAction(formData: FormData) {
  ensureEnvLoaded();
  const next = pickNextFromFormData(formData);
  const pw = formData.get("password");
  const password = typeof pw === "string" ? pw : "";
  const rawDisplayName = formData.get("displayName");
  const displayName = normalizeAdminActorName(typeof rawDisplayName === "string" ? rawDisplayName : "") || "Unknown";
  const clientIp = await getClientIpFromNextHeaders();
  const configError = getAdminAuthConfigError();

  if (configError === "missing_password") {
    redirect(`/admin/login?error=disabled&next=${encodeURIComponent(next)}`);
  }
  if (configError === "missing_session_secret") {
    redirect(`/admin/login?error=config&next=${encodeURIComponent(next)}`);
  }

  const rateLimit = checkAdminLoginRateLimit(clientIp);
  if (!rateLimit.allowed) {
    redirect(`/admin/login?error=rate&next=${encodeURIComponent(next)}`);
  }

  if (!verifyAdminPassword(password)) {
    const result = recordAdminLoginFailure(clientIp);
    if (!result.allowed) {
      redirect(`/admin/login?error=rate&next=${encodeURIComponent(next)}`);
    }
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const secret = getAdminSessionSecret();
  if (!secret) {
    redirect(`/admin/login?error=config&next=${encodeURIComponent(next)}`);
  }

  const token = await createAdminSessionToken(secret, ADMIN_SESSION_MAX_AGE_SEC * 1000, displayName);
  clearAdminLoginRateLimit(clientIp);
  appendAdminAuditEntry({
    actorName: displayName,
    ip: clientIp,
    action: "auth.login",
    route: "/admin/login",
    target: "admin-session",
    summary: "Signed in to admin",
  });
  const secure = await shouldUseSecureCookieFromRequestHeaders();
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
    secure,
  });

  redirect(next);
}

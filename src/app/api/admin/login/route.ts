import { NextResponse } from "next/server";
import { appendAdminAuditEntry } from "@/lib/admin-audit";
import { ensureEnvLoaded } from "@/lib/ensure-env";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginRateLimit,
  getClientIpFromRequest,
  recordAdminLoginFailure,
} from "@/lib/admin-rate-limit";
import {
  ADMIN_SESSION_MAX_AGE_SEC,
  createAdminSessionToken,
  getAdminAuthConfigError,
  getAdminAuthConfigErrorMessage,
  getAdminSessionSecret,
  normalizeAdminActorName,
} from "@/lib/admin-session";
import { verifyAdminPassword } from "@/lib/admin-auth-password";
import { adminSessionCookieHeader, shouldUseSecureCookie } from "@/lib/admin-api";
import { blockCrossSiteMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  ensureEnvLoaded();
  const configError = getAdminAuthConfigError();
  if (configError) {
    return NextResponse.json(
      { error: getAdminAuthConfigErrorMessage(configError) },
      { status: 503 }
    );
  }

  const clientIp = getClientIpFromRequest(request);
  const rateLimit = checkAdminLoginRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      }
    );
  }

  let body: { password?: string; displayName?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const displayName = normalizeAdminActorName(typeof body.displayName === "string" ? body.displayName : "") || "Unknown";
  if (!verifyAdminPassword(password)) {
    const result = recordAdminLoginFailure(clientIp);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSec) },
        }
      );
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const secret = getAdminSessionSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin auth is misconfigured because ADMIN_SESSION_SECRET is not set." },
      { status: 503 }
    );
  }

  const token = await createAdminSessionToken(secret, ADMIN_SESSION_MAX_AGE_SEC * 1000, displayName);
  clearAdminLoginRateLimit(clientIp);
  appendAdminAuditEntry({
    actorName: displayName,
    ip: clientIp,
    action: "auth.login",
    route: new URL(request.url).pathname,
    target: "admin-session",
    summary: "Signed in to admin",
  });
  const secure = shouldUseSecureCookie(request);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", adminSessionCookieHeader(token, ADMIN_SESSION_MAX_AGE_SEC, secure));
  return res;
}

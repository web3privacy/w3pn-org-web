import { NextResponse } from "next/server";
import { appendAdminAuditEntry } from "@/lib/admin-audit";
import {
  clearAdminSessionCookieHeader,
  readAdminSessionFromRequest,
  shouldUseSecureCookie,
} from "@/lib/admin-api";
import { getClientIpFromRequest } from "@/lib/admin-rate-limit";
import { blockCrossSiteMutation } from "@/lib/request-security";

/** Clears admin cookie; does not require an active session. */
export async function POST(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const session = await readAdminSessionFromRequest(request);
  if (session) {
    appendAdminAuditEntry({
      actorName: session.displayName ?? "Unknown",
      ip: getClientIpFromRequest(request),
      action: "auth.logout",
      route: new URL(request.url).pathname,
      target: "admin-session",
      summary: "Signed out of admin",
    });
  }
  const secure = shouldUseSecureCookie(request);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearAdminSessionCookieHeader(secure));
  return res;
}

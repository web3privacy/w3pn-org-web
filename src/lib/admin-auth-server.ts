/**
 * Server-only admin gate for HTML routes. Edge middleware cannot rely on process.env
 * for ADMIN_PASSWORD (often missing at build time), so we enforce the session here.
 */

import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureEnvLoaded } from "@/lib/ensure-env";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuthConfigError,
  getAdminSessionSecret,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

/** Call from admin section layouts. Redirects to /admin/login when password is set but session is invalid. */
export async function assertAdminSessionOrRedirect(): Promise<void> {
  ensureEnvLoaded();
  const headersList = await headers();
  const pathname =
    headersList.get("x-middleware-pathname") ||
    headersList.get("x-pathname") ||
    "";
  const search = headersList.get("x-middleware-search") || "";

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return;
  }

  const configError = getAdminAuthConfigError();
  if (configError) {
    const nextTarget = pathname ? encodeURIComponent(`${pathname}${search}`) : encodeURIComponent("/admin");
    const errorParam = configError === "missing_password" ? "disabled" : "config";
    redirect(`/admin/login?error=${errorParam}&next=${nextTarget}`);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const secret = getAdminSessionSecret();
  const ok = await verifyAdminSessionToken(token, secret);
  if (ok) {
    return;
  }

  const nextTarget = pathname ? encodeURIComponent(`${pathname}${search}`) : encodeURIComponent("/admin");
  redirect(`/admin/login?next=${nextTarget}`);
}

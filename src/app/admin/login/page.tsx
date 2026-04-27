import { loginAction } from "./actions";
import "@/styles/org/admin.css";

function pickNext(searchParams: Record<string, string | string[] | undefined>): string {
  const raw = searchParams.next;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== "string") return "/admin";
  if (!s.startsWith("/") || s.startsWith("//")) return "/admin";
  return s;
}

function errorMessage(error: string | undefined): string | null {
  if (error === "invalid") return "Invalid password";
  if (error === "disabled") return "Admin is disabled because ADMIN_PASSWORD is not set.";
  if (error === "config") return "Admin is misconfigured because ADMIN_SESSION_SECRET is not set.";
  if (error === "rate") return "Too many login attempts. Please wait a bit and try again.";
  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialNext = pickNext(params);
  const errRaw = params.error;
  const errParam = Array.isArray(errRaw) ? errRaw[0] : errRaw;
  const errorMsg = errorMessage(typeof errParam === "string" ? errParam : undefined);

  return (
    <div className="org-admin-root org-admin-login-page">
      <div className="org-admin-login-panel">
        <div className="org-admin-login-panel__header">
          <h1 className="org-admin-login-title">Admin sign in</h1>
        </div>
        <form action={loginAction} className="org-admin-login-form" noValidate>
          <input type="hidden" name="next" value={initialNext} />
          <div className="org-admin-login-field">
            <label htmlFor="admin-display-name" className="org-admin-login-label">
              Name for logs
            </label>
            <input
              id="admin-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              className="org-admin-input org-admin-input--wide org-admin-login-input"
              placeholder="Your name"
            />
          </div>
          <div className="org-admin-login-field">
            <label htmlFor="admin-password" className="org-admin-login-label">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="org-admin-input org-admin-input--wide org-admin-login-input"
              placeholder="••••••••"
              aria-invalid={errorMsg ? "true" : "false"}
              aria-describedby={errorMsg ? "admin-login-error" : undefined}
            />
          </div>
          {errorMsg ? (
            <p id="admin-login-error" className="org-admin-login-error" role="alert">
              {errorMsg}
            </p>
          ) : null}
          <button type="submit" className="org-admin-btn org-admin-btn--primary org-admin-login-submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

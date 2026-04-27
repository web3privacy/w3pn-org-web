const DEFAULT_ALLOWED_HOSTS_ENV =
  process.env.NEXT_PUBLIC_ALLOWED_NEWSLETTER_ACTION_HOSTS ??
  process.env.ALLOWED_NEWSLETTER_ACTION_HOSTS ??
  "";

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

export function getAllowedNewsletterActionHosts(): string[] {
  return DEFAULT_ALLOWED_HOSTS_ENV
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
}

function isHostAllowed(hostname: string, allowedHosts: string[]): boolean {
  const normalized = normalizeHost(hostname);
  return allowedHosts.some((allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`));
}

export function sanitizeNewsletterActionUrl(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "";
  }

  if (parsed.protocol !== "https:") {
    return "";
  }

  const allowedHosts = getAllowedNewsletterActionHosts();
  if (allowedHosts.length === 0) {
    return "";
  }

  if (!isHostAllowed(parsed.hostname, allowedHosts)) {
    return "";
  }

  return parsed.toString();
}

export function isAllowedNewsletterActionUrl(value: string | null | undefined): boolean {
  if (!(value?.trim())) return true;
  return Boolean(sanitizeNewsletterActionUrl(value));
}

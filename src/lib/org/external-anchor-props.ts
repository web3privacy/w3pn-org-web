/**
 * target/rel for <a> when href is an absolute http(s) or protocol-relative URL.
 * Trims whitespace so CMS values like " https://…" still open in a new tab.
 */
export function externalAnchorRelProps(
  href: string | undefined | null,
): { target: "_blank"; rel: string } | undefined {
  if (href == null || typeof href !== "string") return undefined;
  const h = href.trim();
  if (!h || h.startsWith("#")) return undefined;
  if (h.startsWith("/") && !h.startsWith("//")) return undefined;
  if (/^https?:\/\//i.test(h) || h.startsWith("//")) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return undefined;
}

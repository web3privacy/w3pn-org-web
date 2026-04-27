/**
 * Nav helpers for standalone org web. All routes are at root level.
 */

export function isNavItemActive(href: string, pathname: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("#")) return false;
  const path = (pathname ?? "").replace(/\/$/, "") || "/";
  const hrefPath = href.split("?")[0].replace(/\/$/, "") || "/";
  if (hrefPath === "/privacy-portal") return path === "/privacy-portal";
  if (hrefPath === "/projects") return path === "/projects" || path.startsWith("/projects/");
  if (hrefPath === "/events") return path === "/events" || (path.startsWith("/events/") && path !== "/events/admin");
  if (hrefPath === "/docs") return path === "/docs" || path.startsWith("/docs/");
  if (hrefPath === "/resources") return path === "/resources";
  return path === hrefPath;
}

type NavItem = { label: string; href?: string; external?: boolean };

export function getNavItemsForOrgWeb(content: { nav?: { items?: NavItem[] } }, pathname: string): NavItem[] {
  const raw = content?.nav?.items ?? [];
  const isHome = pathname === "/" || pathname === "";

  const items = raw.map((item) => {
    const out = { ...item };
    if (item.label === "PRIVACY PORTAL") {
      out.href = "/privacy-portal";
      out.external = false;
      return out;
    }
    if (item.href?.startsWith("#") && !isHome) {
      out.href = `/${item.href}`;
    }
    if (out.href?.startsWith("/org/")) {
      out.href = out.href.replace(/^\/org/, "");
    }
    return out;
  });

  return items;
}

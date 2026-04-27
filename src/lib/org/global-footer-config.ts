/** Extracts GlobalFooter props from the org content object for the global footer component. */

import type { GlobalFooterConfig } from "@/components/org/global-footer";

type Content = Record<string, unknown>;

export function getOrgGlobalFooterConfig(content: Content): GlobalFooterConfig {
  const c = content as {
    contribute?: GlobalFooterConfig["contribute"];
    donation?: GlobalFooterConfig["donation"];
    newsletter?: GlobalFooterConfig["newsletter"];
    members?: GlobalFooterConfig["members"];
    footer?: GlobalFooterConfig["footer"];
  };
  const footer = (c.footer ?? {}) as GlobalFooterConfig["footer"] & {
    siteMap?: { portal?: Array<{ label: string; href: string; external?: boolean }> };
  };
  if (footer.siteMap?.portal?.length) {
    footer.siteMap = {
      ...footer.siteMap,
      portal: footer.siteMap.portal.map((item) =>
        item.label === "Privacy Portal" || item.label.toLowerCase().includes("privacy portal")
          ? { ...item, label: item.label, href: "/privacy-portal", external: false }
          : item
      ),
    };
  }
  return {
    contribute: c.contribute ?? {},
    donation: c.donation ?? {},
    newsletter: c.newsletter ?? {},
    members: c.members ?? {},
    footer: footer ?? {},
  };
}

"use client";

import { orgAsset } from "./ProjectDetailLayout";

type Partner = { name?: string; logo?: string; href?: string; description?: string };

const LOGO_SIZE = 128;

/** Colors for partner logo placeholders (index % length) */
const PARTNER_PLACEHOLDER_COLORS = [
  "rgba(112,255,136,0.2)",   // green
  "rgba(100,180,255,0.2)",   // blue
  "rgba(180,120,255,0.2)",   // purple
  "rgba(255,180,100,0.2)",   // orange
  "rgba(100,220,220,0.2)",   // teal
];

function getInitials(name: string | undefined): string {
  if (!name || !name.trim()) return "?";
  const s = name.trim();
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 3);
  }
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

/** Unique placeholder image for each partner (when logo is missing or fails to load) */
function getPartnerPlaceholderImageUrl(index: number): string {
  return `https://picsum.photos/128/128?random=partner${index}`;
}

/** Placeholder SVG for a specific partner – initials + color by index (fallback) */
function getPartnerPlaceholderSvg(p: Partner, index: number): string {
  const initials = getInitials(p.name);
  const fill = PARTNER_PLACEHOLDER_COLORS[index % PARTNER_PLACEHOLDER_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="${fill}" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="28" font-weight="600" font-family="system-ui,sans-serif">${initials}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function partnerLogoUrl(p: Partner, index: number): string {
  if (!p.logo || typeof p.logo !== "string" || !p.logo.trim()) return getPartnerPlaceholderImageUrl(index);
  const resolved = orgAsset(p.logo);
  return resolved || getPartnerPlaceholderImageUrl(index);
}

export function ProjectDetailPartners({ partners }: { partners: Partner[] | undefined }) {
  if (!partners?.length) return null;

  return (
    <section className="event-detail-section project-detail-section project-detail-partners-section">
      <img src="/images/projects/detail/assets/title-partners.webp" alt="PARTNERS" className="project-detail-section-title-img" width={180} height={40} />
      <div className="about-team-inner">
        <div className="project-detail-partners-grid">
          {partners.map((p, i) => {
            const logoUrl = partnerLogoUrl(p, i);
            const fallbackPlaceholder = getPartnerPlaceholderImageUrl(i);
            const fallbackSvg = getPartnerPlaceholderSvg(p, i);
            const isPlaceholder = !p.logo?.trim() || logoUrl.startsWith("https://picsum") || logoUrl.startsWith("data:");
            const cell = (
              <>
                <div className="project-detail-partner-logo">
                  <img
                    src={logoUrl}
                    alt={p.name ?? ""}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    loading="lazy"
                    className={isPlaceholder ? "project-detail-partner-logo-placeholder" : undefined}
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (t.src?.includes("picsum.photos")) {
                        t.src = fallbackSvg;
                        t.classList.add("project-detail-partner-logo-placeholder");
                      } else if (!t.src?.startsWith("data:")) {
                        t.src = fallbackPlaceholder;
                        t.classList.add("project-detail-partner-logo-placeholder");
                      }
                    }}
                  />
                </div>
                <h5 className="project-detail-partner-name">{p.name}</h5>
                {p.description && <p className="project-detail-partner-desc">{p.description}</p>}
              </>
            );

            return p.href ? (
              <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="project-detail-partner-cell" title={p.name}>
                {cell}
              </a>
            ) : (
              <div key={i} className="project-detail-partner-cell" title={p.name}>
                {cell}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

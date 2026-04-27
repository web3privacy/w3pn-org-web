"use client";

import { ACCENT } from "./ProjectDetailLayout";

const sectionStyle: React.CSSProperties = {
  boxSizing: "border-box",
};

const DEFAULT_CONTRIBUTE = {
  text: "Want to shape the future of privacy? Join us as a developer, researcher, designer, or community builder.",
  links: [
    { label: "Code", href: "https://github.com/web3privacy" },
    { label: "Documentation", href: "https://docs.web3privacy.info" },
    { label: "Design", href: "/" },
    { label: "Feedback", href: "/" },
  ],
};

function ContributeLinkIcon({ icon }: { icon?: string }) {
  if (!icon) return null;
  return (
    <span
      aria-hidden
      data-icon={icon}
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ACCENT,
        opacity: 0.9,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

type ContributeData = {
  text?: string;
  /** Optional shorter copy for viewports ≤1024px (tablet/mobile). If omitted, full text is line-clamped (~2 lines). */
  textShort?: string;
  links?: Array<{ label: string; href: string; icon?: string }>;
  /** When true, hide this section for viewports ≤1024px (tablet + mobile); still shown on desktop. */
  desktopOnly?: boolean;
};

export function ProjectDetailContribute({ contribute: contributeData }: { contribute: ContributeData | undefined }) {
  const contribute = { ...DEFAULT_CONTRIBUTE, ...contributeData } as ContributeData & typeof DEFAULT_CONTRIBUTE;
  const links: Array<{ label: string; href: string; icon?: string }> = (contribute.links ?? DEFAULT_CONTRIBUTE.links) as Array<{ label: string; href: string; icon?: string }>;
  const textShort = contribute.textShort?.trim();
  const desktopOnly = Boolean(contribute.desktopOnly);
  const sectionClass = ["project-detail-contribute-section", desktopOnly ? "project-detail-contribute-section--desktop-only" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClass} style={sectionStyle}>
      <div className="project-detail-contribute-inner">
        <div className="project-detail-contribute-main">
          <img src="/images/projects/detail/assets/title-contribute.webp" alt="CONTRIBUTE" className="project-detail-section-title-img" width={220} height={40} />
          {textShort ? (
            <>
              <p className="project-detail-contribute-text project-detail-contribute-text--desktop-lg">{contribute.text}</p>
              <p className="project-detail-contribute-text project-detail-contribute-text--tablet-mobile">{textShort}</p>
            </>
          ) : (
            <p className="project-detail-contribute-text project-detail-contribute-text--clamp-below-lg">{contribute.text}</p>
          )}
        </div>
        <div className="project-detail-contribute-howto">
          <h3 className="project-detail-contribute-howto-title">How to:</h3>
          <ul className="project-detail-contribute-links">
            {links.map((link) => (
              <li key={link.label}>
                <ContributeLinkIcon icon={link.icon} />
                <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useOrgContent } from "@/lib/org/OrgContentContext";

const FALLBACK_BG = "/images/projects/page/assets/bg-projects.jpg";

export function ProjectsHero() {
  const content = useOrgContent();
  const hero = ((content?.projectsPage as Record<string, unknown> | undefined)?.hero ?? {}) as {
    backgroundImage?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  const backgroundImage = hero.backgroundImage?.trim() || FALLBACK_BG;
  const title =
    hero.title?.trim() ||
    "We are building privacy data, social\nand education essentials for community";
  const description =
    hero.description?.trim() ||
    "Our 28 projects aim to drive political and social change by advocating privacy in the Web3 era.\n\nWith unified efforts, we carve out a path toward a more equitable, decentralized and freedom-respecting digital commons.";
  const ctaLabel = hero.ctaLabel?.trim() || "Open Github";
  const ctaHref = hero.ctaHref?.trim() || "https://github.com/web3privacy";
  const titleLines = title.split("\n");
  const descParagraphs = description.split(/\n\n+/).filter(Boolean);
  const ctaExternal = /^https?:\/\//i.test(ctaHref);

  return (
    <section className="projects-hero hero">
      <img
        className="hero-bg projects-hero-bg"
        src={backgroundImage}
        alt=""
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>
          {titleLines.map((line, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>
        {descParagraphs.map((para, i) => (
          <p key={i} className="projects-hero-desc">
            {para}
          </p>
        ))}
        <a
          href={ctaHref}
          className="primary-btn hero-cta"
          {...(ctaExternal ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

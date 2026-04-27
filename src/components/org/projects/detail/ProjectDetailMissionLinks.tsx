"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { orgAsset } from "./ProjectDetailLayout";

const LINK_LABELS: Record<string, string> = {
  url: "Website", website: "Website", docs: "Documentation", github: "GitHub",
  twitter: "Twitter", discord: "Discord", telegram: "Telegram",
};
const LINK_ICONS: Record<string, string> = {
  url: "icon-website", website: "icon-website", docs: "icon-docs", github: "icon-github",
  twitter: "icon-twitter", discord: "icon-discord", telegram: "icon-telegram",
};

function LinkIcon({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      data-icon={name}
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "currentColor",
        opacity: 0.7,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

type Mission = { text?: string; readMoreHref?: string; highlights?: Array<{ src?: string; alt?: string; caption?: string }> };
type Links = Record<string, string>;

export function ProjectDetailMissionLinks({
  mission,
  links,
  screenshotsSlot,
  linksColumnExtraBottomPadding,
}: {
  mission: Mission | undefined;
  links: Links | undefined;
  /** When set, screenshots are laid out between mission and links on mobile (desktop unchanged). */
  screenshotsSlot?: ReactNode;
  /** Tablet/mobile: +24px under LINKS when only Contribute and/or Feedback follow Mission (≤1024px CSS). */
  linksColumnExtraBottomPadding?: boolean;
}) {
  const linkEntries = Object.entries(links || {}).filter(([, v]) => v && String(v).startsWith("http"));
  const hasLinks = linkEntries.length > 0;
  const highlights = mission?.highlights ?? [];
  const proseRef = useRef<HTMLParagraphElement>(null);
  const [showReadMore, setShowReadMore] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = proseRef.current;
    if (!el) return;
    const measure = () => {
      setShowReadMore(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mission?.text, expanded]);

  const gridClass =
    "event-detail-topics-links-grid project-detail-mission-links" +
    (screenshotsSlot ? " project-detail-mission-links-shots" : "") +
    (!hasLinks ? " project-detail-mission-links--no-links" : "");

  return (
    <section className="event-detail-section event-detail-topics-links project-detail-section">
      <div className={gridClass}>
        <div className="event-detail-topics-col project-detail-mission-links-mission">
          <img src="/images/projects/detail/assets/title-mission.webp" alt="MISSION" className="project-detail-section-title-img" width={160} height={40} />
          <div className="event-detail-prose">
            <p
              ref={proseRef}
              className={!expanded ? "project-detail-mission-text--clamped" : undefined}
              style={{ margin: 0, whiteSpace: "pre-line" }}
            >
              {mission?.text}
            </p>
          </div>
          {showReadMore && (
            <button
              type="button"
              className="event-detail-topics-links-show-more"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          {highlights.length > 0 && (
            <div className="project-detail-mission-highlights" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {highlights.slice(0, 3).map((h, i) => (
                <div key={i} style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
                  {h.src && (
                    <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
                      <img src={orgAsset(h.src)} alt={h.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  {h.caption && <p style={{ padding: 8, fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0 }}>{h.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        {screenshotsSlot ? (
          <div className="project-detail-mission-links-screenshots-slot">{screenshotsSlot}</div>
        ) : null}
        {hasLinks ? (
          <div
            className={
              "event-detail-links-col project-detail-mission-links-links" +
              (linksColumnExtraBottomPadding ? " project-detail-mission-links-links--tail-spacer" : "")
            }
          >
            <img src="/images/projects/detail/assets/title-links.webp" alt="LINKS" className="project-detail-section-title-img" width={120} height={40} />
            <ul className="event-detail-links">
              {linkEntries.map(([key, href]) => (
                <li key={key} className="event-detail-link-item">
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <span className="event-detail-link-icon">
                      <LinkIcon name={LINK_ICONS[key] ?? "icon-website"} />
                    </span>
                    {LINK_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

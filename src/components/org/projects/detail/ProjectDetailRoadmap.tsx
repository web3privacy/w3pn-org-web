"use client";

import { useMemo } from "react";
import { ACCENT } from "./ProjectDetailLayout";

type RoadmapItem = {
  phase?: string;
  quarter?: string;
  title?: string;
  description?: string;
  release?: string;
  items?: string[];
  readMoreHref?: string;
  completed?: boolean;
};

/** Parse "Q1 2026" or "2026 Q1" to { y, q } for sorting. */
function parseQuarter(s: string): { y: number; q: number } | null {
  if (!s || typeof s !== "string") return null;
  const qFirst = s.match(/Q(\d)\s*(\d{4})/i);
  if (qFirst) return { y: parseInt(qFirst[2], 10), q: parseInt(qFirst[1], 10) };
  const yFirst = s.match(/(\d{4})\s*Q(\d)/i);
  if (yFirst) return { y: parseInt(yFirst[1], 10), q: parseInt(yFirst[2], 10) };
  const yearOnly = s.match(/(\d{4})/);
  if (yearOnly) return { y: parseInt(yearOnly[1], 10), q: 0 };
  return null;
}

function sortKey(item: RoadmapItem, index: number): number {
  const p = parseQuarter(item.quarter ?? item.phase ?? "");
  return p ? p.y * 10 + p.q : index;
}

function RoadmapItemContent({ item, isPast }: { item: RoadmapItem; isPast: boolean }) {
  const titleColor = isPast ? ACCENT : "#fff";
  const textColor = isPast ? ACCENT : "rgba(255,255,255,0.85)";
  const title = [item.phase ?? item.quarter, item.title].filter(Boolean).join(" – ");

  return (
    <div className="project-detail-roadmap-content">
      {title && (
        <span className="project-detail-roadmap-title" style={{ color: titleColor }}>
          {title}
          {isPast && <span className="project-detail-roadmap-check" aria-hidden> ✓</span>}
        </span>
      )}
      {item.description && <p className="project-detail-roadmap-desc" style={{ color: textColor }}>{item.description}</p>}
      {item.release && <p className="project-detail-roadmap-release" style={{ color: textColor }}>{item.release}</p>}
      {item.items?.length ? (
        <ul className="project-detail-roadmap-subpoints" style={{ color: textColor }}>
          {item.items.map((bullet, j) => (
            <li key={j}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {item.readMoreHref && (
        <a href={item.readMoreHref} target="_blank" rel="noopener noreferrer" className="project-detail-roadmap-readmore">READ MORE</a>
      )}
    </div>
  );
}

export function ProjectDetailRoadmap({
  roadmap: roadmapItems,
  roadmapPagination,
}: {
  roadmap: RoadmapItem[] | undefined;
  roadmapPagination?: { current?: number; total?: number };
}) {
  const roadmapList = useMemo(() => roadmapItems ?? [], [roadmapItems]);

  const { past, future } = useMemo(() => {
    const pastItems = roadmapList.filter((item) => item.completed);
    const futureItems = roadmapList.filter((item) => !item.completed);
    const withKey = (item: RoadmapItem, i: number) => ({ item, key: sortKey(item, i) });
    const sortPast = pastItems.map(withKey).sort((a, b) => b.key - a.key).map((x) => x.item);
    const sortFuture = futureItems.map(withKey).sort((a, b) => a.key - b.key).map((x) => x.item);
    return { past: sortPast, future: sortFuture };
  }, [roadmapList]);

  if (!roadmapList.length) return null;

  return (
    <section className="event-detail-section project-detail-section" role="region" aria-label="Roadmap">
      <img src="/images/projects/detail/assets/title-roadmap.webp" alt="ROADMAP" className="project-detail-section-title-img" width={180} height={40} />
      <div className="project-detail-roadmap-timeline">
        {/* Future items on top – white line, white squares with dot */}
        {future.length > 0 && (
          <div className="project-detail-roadmap-segment project-detail-roadmap-segment--future">
            <ul className="project-detail-roadmap-list" aria-label="Upcoming">
              {future.map((item, i) => (
                <li key={i} className="project-detail-roadmap-item project-detail-roadmap-item--future">
                  <div className="project-detail-roadmap-bullet-wrap">
                    <span className="project-detail-roadmap-bullet project-detail-roadmap-bullet--future" aria-hidden />
                  </div>
                  <RoadmapItemContent item={item} isPast={false} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {past.length > 0 && future.length > 0 && (
          <div className="project-detail-roadmap-now" aria-hidden>
            <span className="project-detail-roadmap-now-label">Now</span>
          </div>
        )}
        {/* Completed items below – green line, green squares + checkmark */}
        {past.length > 0 && (
          <div className="project-detail-roadmap-segment project-detail-roadmap-segment--past">
            <ul className="project-detail-roadmap-list project-detail-roadmap-list--past" aria-label="Completed">
              {past.map((item, i) => (
                <li key={i} className="project-detail-roadmap-item project-detail-roadmap-item--past">
                  <div className="project-detail-roadmap-bullet-wrap">
                    <span className="project-detail-roadmap-bullet project-detail-roadmap-bullet--past" aria-hidden />
                  </div>
                  <RoadmapItemContent item={item} isPast={true} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {roadmapPagination && roadmapPagination.total && roadmapPagination.total > 1 && (
        <p className="project-detail-roadmap-pagination">
          {roadmapPagination.current} of {roadmapPagination.total}
        </p>
      )}
    </section>
  );
}

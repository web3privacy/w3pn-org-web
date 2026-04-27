"use client";

type Metric = { value?: string; label?: string; sublabel?: string };

export function ProjectDetailHighlights({
  metrics,
}: {
  metrics?: Metric[];
}) {
  const items = metrics ?? [];
  if (items.length === 0) return null;

  return (
    <section className="project-detail-highlights">
      <div className="project-detail-highlights-inner">
        {items.map((m, i) => (
          <div key={i} className="project-detail-highlights-item">
            <span className="project-detail-highlights-value">{m.value}</span>
            <span className="project-detail-highlights-label-group">
              {[m.label, m.sublabel].filter(Boolean).join(" ")}
            </span>
          </div>
        ))}
      </div>
      <div className="project-detail-highlights-line" aria-hidden="true" />
    </section>
  );
}

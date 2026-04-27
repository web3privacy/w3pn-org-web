"use client";

export function ProjectDetailPlaceholder({ sectionTitle, message = "Content will be added soon." }: { sectionTitle: string; message?: string }) {
  return (
    <section className="event-detail-section project-detail-section">
      <h2 className="event-detail-section-title project-detail-section-title">{sectionTitle}</h2>
      <p style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{message}</p>
    </section>
  );
}

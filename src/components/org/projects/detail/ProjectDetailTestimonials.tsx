"use client";

import { useState } from "react";
import { orgAsset } from "./ProjectDetailLayout";

type Testimonial = { avatar?: string; name?: string; role?: string; quote?: string };

/** Paths like /projects/explorer.png are project logos, not people photos – use placeholder */
function isProjectAsset(path: string | undefined): boolean {
  if (!path || typeof path !== "string" || !path.trim()) return true;
  return /^\/projects\/.+\.(png|jpg|jpeg|webp)$/i.test(path);
}

const TESTIMONIAL_PLACEHOLDER = (i: number) => `https://picsum.photos/200/200?random=testimonial${i}`;

export function ProjectDetailTestimonials({ testimonials, readMoreHref }: { testimonials: Testimonial[] | undefined; readMoreHref?: string }) {
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const testimonialsList = testimonials ?? [];
  const shouldCollapse = testimonialsList.length > 6;

  if (!testimonialsList.length) return null;

  return (
    <section className="event-detail-section project-detail-section testimonials">
      <img src="/images/projects/detail/assets/title-testimonials.webp" alt="TESTIMONIALS" className="project-detail-section-title-img" width={240} height={40} />
      <div
        className={`testimonial-stack ${shouldCollapse && !showAllTestimonials ? "is-collapsed" : "is-expanded"}`}
        style={{ marginTop: 24 }}
      >
        <div className="testimonial-grid">
          {testimonialsList.map((t, i) => {
            const avatarSrc = t.avatar && !isProjectAsset(t.avatar) ? orgAsset(t.avatar) : TESTIMONIAL_PLACEHOLDER(i);
            return (
            <article
              key={`${t.name ?? "testimonial"}-${i}`}
              className="testimonial-card"
            >
              <header>
                <img
                  src={avatarSrc}
                  alt={t.name ?? ""}
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src?.includes("picsum.photos")) el.src = TESTIMONIAL_PLACEHOLDER(i);
                  }}
                />
                <div>
                  <h5>{t.name}</h5>
                  <p>{t.role}</p>
                </div>
              </header>
              <p>{t.quote}</p>
            </article>
          );
          })}
        </div>
        {shouldCollapse && !showAllTestimonials && <div className="testimonial-fade" aria-hidden />}
      </div>
      {shouldCollapse && !showAllTestimonials && (
        <div className="testimonials-cta">
          <button
            className="outline-btn testimonials-show-more"
            type="button"
            onClick={() => setShowAllTestimonials(true)}
          >
            READ ALL TESTIMONIALS
          </button>
        </div>
      )}
      {!shouldCollapse && readMoreHref && (
        <a href={readMoreHref} target="_blank" rel="noopener noreferrer" className="event-detail-articles-all-btn">
          READ MORE
          <span className="event-detail-articles-all-arrow" aria-hidden>→</span>
        </a>
      )}
    </section>
  );
}

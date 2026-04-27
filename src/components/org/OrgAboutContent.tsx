"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parseYoutubeVideoId } from "@/lib/youtube";
import { SocialIcon, PlayIcon } from "./SharedIcons";
import { AboutGallerySection, type AboutGalleryData } from "./AboutGallery";
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn, ParallaxWrap } from "./ScrollAnimations";

type Content = Record<string, unknown>;
type SocialItem = { label: string; icon?: string; href: string; visible?: boolean };

type AboutHero = { title?: string; backgroundImage?: string; social?: SocialItem[] };
type AboutMission = {
  title?: string;
  paragraphs?: string[];
  imageUrl?: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};
type AboutStory = {
  title?: string;
  subtitle?: string;
  body?: string;
  timeline?: Array<{ year?: string; quarter?: string; time?: string; title?: string; description?: string; href?: string }>;
  ctaLabel?: string;
  ctaHref?: string;
  ctaMoreLabel?: string;
  ctaMoreHref?: string;
};
type AboutFounders = {
  title?: string;
  body?: string;
  images?: string[];
  ctaReadLabel?: string;
  ctaReadHref?: string;
  ctaJoinLabel?: string;
  ctaJoinHref?: string;
};
type AboutActivism = {
  title?: string;
  body?: string;
  quote?: string;
  quoteAuthor?: string;
  values?: { title: string; body: string }[];
  ctaButtons?: { label: string; href: string; visible?: boolean }[];
};
type AboutWorkItem = {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  highlights?: string[];
  testimonial?: { avatar?: string; name?: string; role?: string; quote?: string };
  orientation?: "left" | "right";
  backgroundColor?: string;
  ctaLabel?: string;
  ctaHref?: string;
  bgVariant?: number;
};
type AboutTeam = {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  members?: { name: string; role: string; image: string; href?: string }[];
  statsSentence?: string;
  ctaLabel?: string;
  ctaHref?: string;
};
type AboutAmbassadors = { title?: string; hidden?: boolean; members?: { name: string; role: string; image: string; href?: string }[] };
type AboutPartners = { title?: string; hidden?: boolean; logos?: string[] };
type AboutEvent = { title?: string; date?: string; location?: string; image?: string; ctaLabel?: string; ctaHref?: string };
type AboutFAQ = { title?: string; items?: { question: string; answer: string }[] };
type AboutCommunity = {
  title?: string;
  subtitle?: string;
  body?: string;
  logoUrl?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  social?: { label: string; icon?: string; href: string }[];
};

function AboutHeroSection({ hero, socialLinks }: { hero?: AboutHero; socialLinks?: SocialItem[] }) {
  if (!hero) return null;
  const social = (socialLinks ?? hero.social ?? []).filter((s) => (s as { visible?: boolean }).visible !== false);
  return (
    <section className="about-hero" id="about">
      {hero.backgroundImage && (
        <ParallaxWrap
          className="about-hero-bg-wrap"
          speed={0.12}
          parallaxOffBelow={769}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        >
          <img className="about-hero-bg" src={hero.backgroundImage} alt="" />
        </ParallaxWrap>
      )}
      <div className="about-hero-overlay" aria-hidden />
      <div className="about-hero-content">
        <FadeIn delay={0.2} duration={0.8}><h1>{hero.title}</h1></FadeIn>
        {social.length > 0 && (
          <StaggerContainer className="social-row hero-social-icons-only about-hero-social" stagger={0.07}>
            {social.map((s) => (
              <StaggerItem as="a" key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={s.label} title={s.label}>
                <span className="social-icon-wrap">
                  <SocialIcon icon={s.icon ?? s.label?.toLowerCase() ?? ""} />
                </span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}

function AboutMissionSection({ mission }: { mission?: AboutMission }) {
  const [missionVideoPlaying, setMissionVideoPlaying] = useState(false);
  const videoId = parseYoutubeVideoId(mission?.videoUrl);
  const videoPoster = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
  if (!mission) return null;
  return (
    <section className="about-section about-mission-section" id="mission">
      <div className="about-mission">
        <FadeIn direction="left" className="about-mission-text">
          <h2>{mission.title}</h2>
          {mission.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
          {mission.ctaLabel && (
            <a href={mission.ctaHref ?? "#"} className="about-mission-manifesto-btn outline-btn" target={mission.ctaHref?.startsWith("http") ? "_blank" : undefined} rel={mission.ctaHref?.startsWith("http") ? "noreferrer" : undefined}>
              {mission.ctaLabel}
            </a>
          )}
        </FadeIn>
        <FadeIn direction="right" delay={0.15} className="about-mission-media">
          {videoId && (
            <article className={videoId ? "video-card video-card--embed" : "video-card"}>
              {videoId ? (
                <div className="video-card__player">
                  {missionVideoPlaying ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                      title={mission.title ?? "YouTube video"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <button
                      type="button"
                      className="video-card__poster"
                      onClick={() => setMissionVideoPlaying(true)}
                      aria-label={mission.title ? `Play video: ${mission.title}` : "Play video"}
                    >
                      {videoPoster ? (
                        <img
                          src={videoPoster}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const t = e.currentTarget;
                            if (t.src?.includes("/hqdefault.")) {
                              t.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                            }
                          }}
                        />
                      ) : null}
                      <span className="video-card__poster-shade" aria-hidden />
                      <span className="video-card__play-wrap">
                        <span className="video-card__play-icon">
                          <PlayIcon />
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                videoPoster && <img src={videoPoster} alt={mission.title ?? ""} loading="lazy" />
              )}
            </article>
          )}
        </FadeIn>
      </div>
    </section>
  );
}

const GRID_STEP_PX = 200;

function AboutStorySection({ story }: { story?: AboutStory }) {
  const timeline = story?.timeline ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.6), behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollState, timeline.length]);

  if (!story) return null;
  /* Track width = data width + one grid step (no min(viewport) — avoids long empty scroll) */
  const totalWidth =
    timeline.length === 0
      ? GRID_STEP_PX * 2
      : timeline.length * GRID_STEP_PX + GRID_STEP_PX;

  const firstIndexByYear = new Map<string, number>();
  timeline.forEach((item, index) => {
    const y = item.year;
    if (y && !firstIndexByYear.has(y)) firstIndexByYear.set(y, index);
  });
  const yearLabels = Array.from(firstIndexByYear.entries()).map(([year, index]) => ({ year, index }));

  return (
    <section className="about-section about-story-section about-story-section--fullwidth" id="story">
      <FadeIn>
        <div className="about-story-header">
          <h2 className="about-section-title">{story.title ?? "Our History"}</h2>
          {story.body && <p className="about-story-body">{story.body}</p>}
        </div>
      </FadeIn>
      <FadeIn delay={0.2} duration={0.8}>
      <div className="about-story-timeline-outer">
        <button
          type="button"
          className="about-story-scroll-btn about-story-scroll-btn--left"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          disabled={!canScrollLeft}
          style={{ visibility: canScrollLeft ? "visible" : "hidden" }}
        />
        <div
          className="about-story-timeline-scroll"
          ref={scrollRef}
          onScroll={updateScrollState}
          style={{ ["--timeline-width" as string]: `${totalWidth}px` }}
        >
          <div className="about-story-timeline-track">
            {/* Grid spans full track so vertical lines cross the horizontal line */}
            <div className="about-story-timeline-grid" style={{ width: totalWidth }}>
              {Array.from({ length: Math.ceil(totalWidth / GRID_STEP_PX) + 1 }, (_, i) => (
                <div key={i} className="about-story-timeline-vline" style={{ left: i * GRID_STEP_PX }} />
              ))}
            </div>
            {/* Head: years + line in normal flow */}
            <div className="about-story-timeline-head">
              <div className="about-story-timeline-years" style={{ width: totalWidth }}>
                {yearLabels.map(({ year, index }) => (
                  <span
                    key={year}
                    className="about-story-timeline-year"
                    style={{ left: index === 0 ? 32 : index * GRID_STEP_PX }}
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>
            {/* Body: events; points sit exactly on the line (intersection) */}
            <div className="about-story-timeline-body">
              <div className="about-story-timeline-events" style={{ width: totalWidth }}>
                {timeline.map((item, i) => {
                  const left = i * GRID_STEP_PX;
                  const timeLabel = item.time ?? [item.quarter, item.year].filter(Boolean).join(" / ");
                  const isAlt = i % 2 === 1;
                  return (
                    <div
                      key={i}
                      className={`about-story-timeline-event ${isAlt ? "about-story-timeline-event--alt" : ""}`}
                      style={{ left }}
                    >
                      <span className="about-story-timeline-point" aria-hidden />
                      <div className="about-story-timeline-event-card">
                        <span className="about-story-timeline-time">{timeLabel}</span>
                        <span className="about-story-timeline-name">{item.title}</span>
                        <p className="about-story-timeline-desc">{item.description}</p>
                        {item.href && (
                          <a href={item.href} className="about-story-timeline-link" target="_blank" rel="noopener noreferrer">
                            More
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="about-story-scroll-btn about-story-scroll-btn--right"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          disabled={!canScrollRight}
          style={{ visibility: canScrollRight ? "visible" : "hidden" }}
        />
        <div className="about-story-timeline-fade" aria-hidden />
      </div>
      </FadeIn>
    </section>
  );
}

function AboutFoundersSection({ founders }: { founders?: AboutFounders }) {
  if (!founders?.images?.length) return null;
  return (
    <section className="about-section" id="founders">
      <div className="about-founders">
        <div className="about-founders-media">
          <div className="about-founders-grid">
            {founders.images.slice(0, 4).map((src, i) => (
              <div key={i} className="about-founders-cell">
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutActivismSection({ activism }: { activism?: AboutActivism }) {
  if (!activism) return null;
  const values =
    activism.values ?? [
      { title: "MAKING IMPACT ACCESSIBLE", body: "Tools, resources, reports, courses \u2028and events will be free forever" },
      { title: "POWERING CONTRIBUTORS", body: "To researchers, devs and facilitators \u2028committed to advancing privacy" },
      { title: "BUILDING A MOVEMENT", body: "Embrace open-source culture\u2028and multi disciplinary collaboration." },
    ];
  const ctaButtons = (activism.ctaButtons ?? []).filter((b) => (b as { visible?: boolean }).visible !== false);
  return (
    <section className="about-section about-activism">
      <div className="about-activism-inner">
        <FadeIn direction="left" className="about-activism-image">
          <img src="/images/about-us/sections/about/assets/about-activism-collage.webp" alt="" loading="lazy" />
        </FadeIn>
        <FadeIn direction="right" delay={0.15} className="about-activism-content">
          <h2 className="about-activism-title">{activism.title}</h2>
          <p>{activism.body}</p>
          <div className="about-activism-btns">
            {ctaButtons.map((btn) => (
              <a
                key={btn.label}
                href={btn.href}
                className="outline-btn"
                target={btn.href.startsWith("http") ? "_blank" : undefined}
                rel={btn.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {btn.label}
              </a>
            ))}
          </div>
        </FadeIn>
      </div>
      <div className="about-principles">
        <StaggerContainer className="about-principles-grid" stagger={0.12}>
          {values.map((v, i) => (
            <StaggerItem key={i} className="about-principles-card">
              <div className="about-principles-card-head">{v.title}</div>
              <div className="about-principles-card-body">{v.body}</div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function AboutWorkSection({ work }: { work?: { title?: string; items?: AboutWorkItem[] } }) {
  if (!work?.items?.length) return null;
  return (
    <section className="about-section about-work-section" id="work">
      <div className="about-work-section-inner">
        <FadeIn><h2 className="about-work-section-title">{work.title}</h2></FadeIn>
        <div className="about-work-blocks">
        {work.items.map((item, i) => {
          const orientation = item.orientation ?? (i % 2 === 0 ? "right" : "left");
          const bgColor = item.backgroundColor ?? (item.bgVariant === 2 ? "#0d2818" : item.bgVariant === 3 ? "#1a1520" : "#050505");
          return (
            <FadeIn
              key={i}
              direction={orientation === "left" ? "left" : "right"}
              duration={0.7}
              className={`about-work-card-use-case about-work-card-use-case--${orientation}`}
              style={{ "--about-work-bg": bgColor } as React.CSSProperties}
            >
              <div className="about-work-card-use-case-inner">
                <div className="about-work-card-use-case-panel">
                  <div className="about-work-card-use-case-header">
                    {item.logo && <img className="about-work-card-use-case-logo" src={item.logo} alt="" />}
                    <h3 className="about-work-card-use-case-title">{item.title}</h3>
                  </div>
                  {item.highlights?.length ? (
                    <div className="about-work-card-use-case-highlights">
                      {item.highlights.map((h, j) => (
                        <span key={j} className="about-work-card-use-case-highlight">{h}</span>
                      ))}
                    </div>
                  ) : null}
                  {item.description && <p className="about-work-card-use-case-desc">{item.description}</p>}
                  {item.testimonial && (item.testimonial.quote || item.testimonial.name) && (
                    <div className="about-work-card-use-case-testimonial">
                      <div className="about-work-card-use-case-testimonial-head">
                        {item.testimonial.avatar && (
                          <img className="about-work-card-use-case-testimonial-avatar" src={item.testimonial.avatar} alt="" />
                        )}
                        <div>
                          {item.testimonial.name && <span className="about-work-card-use-case-testimonial-name">{item.testimonial.name}</span>}
                          {item.testimonial.role && <span className="about-work-card-use-case-testimonial-role">{item.testimonial.role}</span>}
                        </div>
                      </div>
                      {item.testimonial.quote && <blockquote className="about-work-card-use-case-testimonial-quote">{item.testimonial.quote}</blockquote>}
                    </div>
                  )}
                  {item.ctaLabel && (
                    <a href={item.ctaHref ?? "#"} className="about-work-card-use-case-cta" target="_blank" rel="noopener noreferrer">
                      {item.ctaLabel}
                    </a>
                  )}
                </div>
                <div className="about-work-card-use-case-image" aria-hidden>
                  {item.image && <img src={item.image} alt="" loading="lazy" />}
                  <div className="about-work-card-use-case-gradient" />
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
      </div>
    </section>
  );
}

function AboutTeamSection({ team }: { team?: AboutTeam }) {
  const [teamVideoPlaying, setTeamVideoPlaying] = useState(false);
  const videoId = parseYoutubeVideoId(team?.videoUrl);
  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
  if (!team) return null;
  return (
    <section className="about-section" id="team">
      <div className="about-team-inner">
        <FadeIn><h2 className="about-section-heading-block">{team.title}</h2></FadeIn>
        {team.subtitle && <FadeIn delay={0.1}><p className="about-team-sub">{team.subtitle}</p></FadeIn>}
        <FadeIn delay={0.15}>
        <div className="about-team-video-wrap">
          {videoId ? (
            <div className="video-card__player about-team-video-player">
              {teamVideoPlaying ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={team.title ?? "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button
                  type="button"
                  className="video-card__poster about-team-video-poster"
                  onClick={() => setTeamVideoPlaying(true)}
                  aria-label={team.title ? `Play video: ${team.title}` : "Play video"}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const t = e.currentTarget;
                        if (t.src?.includes("/hqdefault.")) {
                          t.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                        }
                      }}
                    />
                  ) : null}
                  <span className="video-card__poster-shade" aria-hidden />
                  <span className="video-card__play-wrap">
                    <span className="video-card__play-icon">
                      <PlayIcon />
                    </span>
                  </span>
                </button>
              )}
            </div>
          ) : null}
          </div>
        </FadeIn>
        <StaggerContainer className="about-team-grid about-team-grid--grayscale" stagger={0.05} viewportAmount={0.05}>
          {(team.members ?? []).map((m, i) => {
            const imgSrc = m.image || `https://picsum.photos/200/200?random=team${i}`;
            const memberImage = (
              <img
                src={imgSrc}
                alt={m.name}
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.src?.includes("picsum.photos")) t.src = `https://picsum.photos/200/200?random=team${i}`;
                }}
              />
            );
            const memberName = <h5>{m.name}</h5>;
            return (
              <StaggerItem as="article" key={i} className="about-team-member">
                {m.href ? (
                  <>
                    <a href={m.href} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on X`}>
                      {memberImage}
                    </a>
                    <a href={m.href} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on X`}>
                      {memberName}
                    </a>
                  </>
                ) : (
                  <>
                    {memberImage}
                    {memberName}
                  </>
                )}
                <p>{m.role}</p>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
        {team.statsSentence && (
          <FadeIn>
            <p className="about-team-stats">
              {team.statsSentence.split(/(\d+(?:[\s,]?\d+)*(?:k|K|\+)?)/).map((part, i) =>
                /^\d/.test(part) ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          </FadeIn>
        )}
        {team.ctaLabel && (
          <FadeIn>
            <a href={team.ctaHref ?? "#"} className="outline-btn" target="_blank" rel="noopener noreferrer">
              {team.ctaLabel}
            </a>
          </FadeIn>
        )}
      </div>
      <div className="about-team-divider" aria-hidden />
    </section>
  );
}

function AboutAmbassadorsSection({ ambassadors }: { ambassadors?: AboutAmbassadors }) {
  if (!ambassadors?.members?.length || ambassadors.hidden) return null;
  const members = ambassadors.members;
  const n = members.length;
  const nOverflow = Math.max(0, n - 5);
  const startCol = nOverflow > 0 ? Math.floor((5 - nOverflow) / 2) + 1 : 0;

  return (
    <section className="about-section" id="advisors">
      <div className="about-advisors-divider" aria-hidden />
      <div className="about-team-inner">
        <FadeIn><h2 className="about-section-heading-block">{ambassadors.title}</h2></FadeIn>
        <StaggerContainer className="about-ambassadors-grid about-team-grid--grayscale" stagger={0.08}>
          {members.map((m, i) => {
            const imgSrc = m.image || `https://picsum.photos/200/200?random=ambassador${i}`;
            const img = (
              <img
                src={imgSrc}
                alt={m.name}
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.src?.includes("picsum.photos")) t.src = `https://picsum.photos/200/200?random=ambassador${i}`;
                }}
              />
            );
            return (
              <StaggerItem
                as="article"
                key={m.name}
                className="about-team-member"
                style={i >= 5 ? { gridColumn: startCol + (i - 5) } : undefined}
              >
                {m.href ? (
                  <a href={m.href} target="_blank" rel="noopener noreferrer" className="about-ambassador-link">
                    {img}
                    <h5>{m.name}</h5>
                    <p>{m.role}</p>
                  </a>
                ) : (
                  <>
                    {img}
                    <h5>{m.name}</h5>
                    <p>{m.role}</p>
                  </>
                )}
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
      <div className="about-team-divider" aria-hidden />
    </section>
  );
}

function AboutPartnersSection({ partners }: { partners?: AboutPartners }) {
  if (!partners?.logos?.length || partners.hidden) return null;
  return (
    <section className="about-section" id="partners">
      <FadeIn><h2 className="about-section-title">{partners.title}</h2></FadeIn>
      <StaggerContainer className="about-partners-row" stagger={0.06}>
        {partners.logos.map((logo, i) => {
          const imgSrc = logo || `https://picsum.photos/120/60?random=partner${i}`;
          return (
            <StaggerItem key={i} className="about-partners-logo">
              <img
                src={imgSrc}
                alt=""
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.src?.includes("picsum.photos")) t.src = `https://picsum.photos/120/60?random=partner${i}`;
                }}
              />
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}

function AboutEventsSection({ events }: { events?: AboutEvent[] }) {
  if (!events?.length) return null;
  return (
    <section className="about-section about-events">
      <h2 className="about-section-title">Our Events</h2>
      <div className="about-events-list">
        {events.map((ev, i) => (
          <article key={i} className="about-event-card">
            {ev.image && <img src={ev.image} alt="" loading="lazy" />}
            <div className="about-event-content">
              <h4>{ev.title}</h4>
              <p>{ev.date} · {ev.location}</p>
              {ev.ctaLabel && (
                <a href={ev.ctaHref ?? "#"} className="primary-btn" target="_blank" rel="noopener noreferrer">
                  {ev.ctaLabel}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutFAQSection({ faq }: { faq?: AboutFAQ }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!faq?.items?.length) return null;
  return (
    <section className="about-section about-faq-section">
      <div className="about-faq-divider" aria-hidden />
      <FadeIn>
        <div className="about-faq-head">
          <h2 className="about-faq-title">{faq.title ?? "Frequently Asked Questions"}</h2>
        </div>
      </FadeIn>
      <StaggerContainer className="about-faq" stagger={0.08}>
        {faq.items.map((item, i) => (
          <StaggerItem key={i} className={`about-faq-item ${openIndex === i ? "is-open" : ""}`}>
            <button
              type="button"
              className="about-faq-question"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span className="about-faq-question-text">{item.question}</span>
              <span className="about-faq-icon" aria-hidden>
                <svg className="about-faq-icon-svg" viewBox="0 0 24 24" width={24} height={24} aria-hidden focusable="false">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 9l6 6 6-6"
                  />
                </svg>
              </span>
            </button>
            <div className="about-faq-answer">
              <p>{item.answer}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

function AboutCommunitySection({ community }: { community?: AboutCommunity }) {
  if (!community) return null;
  return (
    <section className="about-section about-community">
      <div className="about-community-inner about-community-layout">
        <div className="about-community-logo-wrap">
          {community.logoUrl && (
            <img src={community.logoUrl} alt="" className="about-community-logo" aria-hidden />
          )}
        </div>
        <div className="about-community-content">
          <h2>{community.title}</h2>
          {community.subtitle && <h3>{community.subtitle}</h3>}
          <p>{community.body}</p>
          <div className="about-community-newsletter">
            <input
              type="email"
              placeholder={community.newsletterPlaceholder ?? "Your email address"}
              className="about-community-email"
              aria-label="Email"
            />
            <button type="button" className="primary-btn about-community-subscribe">
              {community.newsletterButtonText ?? "Subscribe"}
            </button>
          </div>
          <div className="about-community-social">
            {(community.social ?? []).map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className="about-social-link">
                <span className="social-icon-wrap">
                  <SocialIcon icon={s.icon ?? s.label?.toLowerCase() ?? ""} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Wrapper for each about section so desktop layout can be full viewport or constrained independently */
function AboutSectionContainer({
  variant = "constrained",
  children,
}: {
  variant?: "constrained" | "full";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`about-section-container about-section-container--${variant}`}
      data-section-width={variant}
    >
      {children}
    </div>
  );
}

export default function OrgAboutContent({ content }: { content: Content }) {
  const homeHero = (content.hero ?? {}) as { social?: SocialItem[] };
  const about = (content.about ?? {}) as {
    hero?: AboutHero;
    mission?: AboutMission;
    story?: AboutStory;
    founders?: AboutFounders;
    activism?: AboutActivism;
    work?: { title?: string; items?: AboutWorkItem[] };
    gallery?: AboutGalleryData;
    team?: AboutTeam;
    ambassadors?: AboutAmbassadors;
    partners?: AboutPartners;
    events?: AboutEvent[];
    faq?: AboutFAQ;
    community?: AboutCommunity;
  };

  return (
    <main className="landing-root about-page" id="top">
      <AboutHeroSection hero={about.hero} socialLinks={homeHero.social} />
      <AboutMissionSection mission={about.mission} />
      <AboutStorySection story={about.story} />
      <AboutSectionContainer variant="constrained">
        <AboutActivismSection activism={about.activism} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="full">
        <AboutWorkSection work={about.work} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="full">
        <AboutGallerySection gallery={about.gallery} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="constrained">
        <AboutTeamSection team={about.team} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="constrained">
        <AboutAmbassadorsSection ambassadors={about.ambassadors} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="constrained">
        <AboutPartnersSection partners={about.partners} />
      </AboutSectionContainer>
      <AboutSectionContainer variant="constrained">
        <AboutFAQSection faq={about.faq} />
      </AboutSectionContainer>
    </main>
  );
}

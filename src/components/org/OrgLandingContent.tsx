/**
 * Landing page content renderer. Builds the full homepage from CMS content sections:
 * hero, partners marquee, intro, impact stats, activities, academy, ecosystem, and testimonials.
 */

"use client";

import { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { buildTestimonialColumnGroups, type TestimonialMasonryItem } from "@/lib/org/testimonials-masonry";
import Link from "next/link";
import { externalAnchorRelProps } from "@/lib/org/external-anchor-props";
import { parseYoutubeVideoId } from "@/lib/youtube";
import { SocialIcon, PlayIcon } from "./SharedIcons";
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "./ScrollAnimations";

type Content = Record<string, unknown>;

function SectionTitle({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function Card({
  title,
  text,
  logo,
  linkText,
  linkHref,
}: {
  title: string;
  text: string;
  logo: string;
  linkText: string;
  linkHref: string;
}) {
  const href = linkHref.trim();
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const inner = (
    <>
      <div className="w3-card-media">
        <img src={logo} alt={`${title} logo`} className="w3-card-logo" loading="lazy" />
      </div>
      <h4>
        <span className="w3-card-title-link">{title}</span>
      </h4>
      <p>{text}</p>
      <span className="w3-card-link">{linkText}</span>
    </>
  );
  return (
    <article className="w3-card">
      {isInternal ? (
        <Link href={href}>
          {inner}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      )}
    </article>
  );
}

export default function OrgLandingContent({ content }: { content: Content }) {
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const [introVideoPlaying, setIntroVideoPlaying] = useState(false);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroSponsorTrackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let raf: number | null = null;
    function onScroll() {
      raf = requestAnimationFrame(() => {
        if (!heroBgRef.current) return;
        const y = window.scrollY * 0.24;
        heroBgRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  const site = (content.site ?? {}) as { title?: string; headerLogo?: string; ctaText?: string; ctaLink?: string };
  const hero = (content.hero ?? {}) as {
    title?: string;
    backgroundImage?: string;
    overlayImage?: string;
    social?: { label: string; icon?: string; href: string }[];
  };
  const partners = (content.partners ?? {}) as { marqueeImage?: string; logos?: { name: string; image: string }[] };
  const partnerMarqueeSig =
    partners.marqueeImage ?? partners.logos?.map((l) => l.image).join("|") ?? "";
  const intro = (content.intro ?? {}) as {
    heading?: string;
    videoThumbnail?: string;
    videoTitle?: string;
    videoLink?: string;
    videoId?: string;
    supporters?: Array<{ name: string; role: string; type?: string; statValue?: string; image?: string }>;
  };
  const introYoutubeId =
    parseYoutubeVideoId(intro.videoId) ?? parseYoutubeVideoId(intro.videoLink);
  const introVideoPoster =
    intro.videoThumbnail?.trim() ||
    (introYoutubeId ? `https://i.ytimg.com/vi/${introYoutubeId}/hqdefault.jpg` : "");
  const impact = (content.impact ?? {}) as {
    title?: string;
    description?: string;
    sectionImage?: string;
    stats?: Array<{ label: string; value: string; labelMobile?: string }>;
  };
  const activities = (content.activities ?? {}) as {
    categories?: Array<{
      title: string;
      titleImage?: string;
      cards: Array<{ title: string; text: string; logo: string; image?: string; linkText: string; linkHref: string }>;
    }>;
    ctaText?: string;
    ctaLink?: string;
  };
  const academy = (content.academy ?? {}) as {
    title?: string;
    backgroundImage?: string;
    showBackground?: boolean;
    cards?: Array<{ title: string; image: string; link?: string; videoId?: string }>;
    ctaText?: string;
    ctaLink?: string;
  };
  const ecosystem = (content.ecosystem ?? {}) as {
    snapshotMode?: boolean;
    title?: string;
    subtitle?: string;
    diagramImage?: string;
    topLabel?: string;
    middleLabel?: string;
    groups?: Array<{ title: string; items: string[] }>;
  };
  const testimonials = (content.testimonials ?? {}) as {
    title?: string;
    items?: TestimonialMasonryItem[];
  };

  const [testimonialColumnCount, setTestimonialColumnCount] = useState(3);
  /** Under 512px: skip masonry stagger (long columns feel sluggish). */
  const [testimonialsInstantMotion, setTestimonialsInstantMotion] = useState(false);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 511px)");
    const sync = () => setTestimonialsInstantMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function resolveColumns(): number {
      if (typeof window === "undefined") return 3;
      if (window.matchMedia("(min-width: 1025px)").matches) return 3;
      if (window.matchMedia("(min-width: 640px)").matches) return 2;
      return 1;
    }
    function update() {
      setTestimonialColumnCount(resolveColumns());
    }
    update();
    const mq3 = window.matchMedia("(min-width: 1025px)");
    const mq2 = window.matchMedia("(min-width: 640px)");
    mq3.addEventListener("change", update);
    mq2.addEventListener("change", update);
    return () => {
      mq3.removeEventListener("change", update);
      mq2.removeEventListener("change", update);
    };
  }, []);

  const testimonialColumns = useMemo(
    () => buildTestimonialColumnGroups(testimonials.items ?? [], testimonialColumnCount),
    [testimonials.items, testimonialColumnCount],
  );

  const marqueeLogos = partners.marqueeImage
    ? Array(4)
        .fill(null)
        .map(() => ({ name: "Partners", image: partners.marqueeImage! }))
    : partners.logos ?? [];

  useLayoutEffect(() => {
    const track = heroSponsorTrackRef.current;
    if (!track) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const firstSet = track.querySelector(".hero-sponsor-set") as HTMLElement | null;
    if (!firstSet) return;
    const apply = () => {
      const w = Math.round(firstSet.getBoundingClientRect().width);
      if (w > 0) {
        track.style.setProperty("--hero-marquee-shift", `${w}px`);
        track.classList.add("hero-sponsor-track--ready");
      }
    };
    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(firstSet);
    firstSet.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", apply, { once: true });
    });
    return () => ro.disconnect();
  }, [partnerMarqueeSig]);

  return (
    <main className="landing-root" id="top">
      <section className="hero" id="manifesto">
        <div ref={heroBgRef} className="hero-bg-wrap" aria-hidden>
          {hero.backgroundImage && (
            <img className="hero-bg" src={hero.backgroundImage} alt="Web3Privacy event" />
          )}
        </div>
        <div
          className={hero.overlayImage ? "hero-overlay hero-overlay-img" : "hero-overlay"}
          style={hero.overlayImage ? { backgroundImage: `url(${hero.overlayImage})` } : undefined}
          aria-hidden
        />
        <div className="hero-content">
          <h1>{hero.title}</h1>
          <div className="social-row hero-social-icons-only">
            {(hero.social ?? [])
              .filter((s) => (s as { visible?: boolean }).visible !== false)
              .map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.label}
                title={social.label}
              >
                <span className="social-icon-wrap">
                  <SocialIcon icon={social.icon ?? social.label?.toLowerCase() ?? ""} />
                </span>
              </a>
            ))}
          </div>
          {site.ctaLink && site.ctaText && (
            <Link className="primary-btn hero-cta" href={site.ctaLink}>
              {site.ctaText}
            </Link>
          )}
        </div>
        <div className="hero-sponsor-marquee" aria-label="Sponsors">
          <div ref={heroSponsorTrackRef} className="hero-sponsor-track">
            <div className="hero-sponsor-set" aria-hidden>
              {marqueeLogos.map((logo, i) => (
                <div key={`a-${i}`} className="sponsor-logo">
                  <img src={logo.image} alt="" />
                </div>
              ))}
            </div>
            <div className="hero-sponsor-set" aria-hidden>
              {marqueeLogos.map((logo, i) => (
                <div key={`b-${i}`} className="sponsor-logo">
                  <img src={logo.image} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-marquee-line" aria-hidden />
      </section>

      <div className="page-content-wrap page-content-wrap--with-padding">
        <section className="intro" id="about">
          <FadeIn><SectionTitle title={intro.heading} /></FadeIn>
          <div className="intro-main">
            <FadeIn delay={0.15}>
              <article className={introYoutubeId ? "video-card video-card--embed" : "video-card"}>
                {introYoutubeId ? (
                  <div className="video-card__player">
                    {introVideoPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${introYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={intro.videoTitle ?? "YouTube video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    ) : (
                      <button
                        type="button"
                        className="video-card__poster"
                        onClick={() => setIntroVideoPlaying(true)}
                        aria-label={
                          intro.videoTitle ? `Play video: ${intro.videoTitle}` : "Play video"
                        }
                      >
                        {introVideoPoster ? (
                          <img src={introVideoPoster} alt="" loading="lazy" decoding="async" />
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
                  intro.videoThumbnail &&
                  (intro.videoLink ? (
                    <a href={intro.videoLink} target="_blank" rel="noopener noreferrer" aria-label={intro.videoTitle ?? "Watch video"}>
                      <img src={intro.videoThumbnail} alt={intro.videoTitle ?? ""} />
                    </a>
                  ) : (
                    <img src={intro.videoThumbnail} alt={intro.videoTitle ?? ""} />
                  ))
                )}
              </article>
            </FadeIn>
            <StaggerContainer className="avatar-grid" stagger={0.06}>
              {(intro.supporters ?? []).map((person) => (
                <StaggerItem
                  as="article"
                  key={person.name}
                  className={person.type === "stat" ? "avatar-item avatar-item-stat" : "avatar-item"}
                >
                  {person.type === "stat" ? (
                    <div className="avatar-stat-circle">{person.statValue}</div>
                  ) : (
                    person.image && <img src={person.image} alt={person.name} />
                  )}
                  <h5>{person.name}</h5>
                  <p>{person.role}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="impact" id="activities">
          <div
            className="impact-top-with-bg"
            style={
              impact.sectionImage
                ? ({
                    ["--impact-section-bg" as string]: `url(${JSON.stringify(impact.sectionImage)})`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="impact-top-overlay" aria-hidden />
            <div className="impact-inner impact-inner--top">
              <FadeIn><SectionTitle title={impact.title} subtitle={impact.description} /></FadeIn>
              <StaggerContainer className="stat-row" stagger={0.1}>
                {(impact.stats ?? []).map((stat) => (
                  <StaggerItem key={stat.label} className="stat-item">
                    <strong>{stat.value}</strong>
                    <span>
                      {stat.labelMobile ? (
                        <>
                          <span className="stat-item-label--desktop">{stat.label}</span>
                          <span className="stat-item-label--mobile">{stat.labelMobile}</span>
                        </>
                      ) : (
                        stat.label
                      )}
                    </span>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
          <div className="impact-inner">
            <StaggerContainer className="activities-grid" id="projects" stagger={0.15} viewportAmount={0.05}>
              {(activities.categories ?? []).map((category) => (
                <StaggerItem key={category.title} className="activity-column">
                  {category.titleImage ? (
                    <img
                      className="activity-title-image"
                      src={category.titleImage}
                      alt={category.title}
                    />
                  ) : (
                    <h3>{category.title}</h3>
                  )}
                  <div className="activity-cards">
                    {category.cards.map((card) => (
                      <Card
                        key={card.title}
                        title={card.title}
                        text={card.text}
                        logo={card.logo}
                        linkText={card.linkText}
                        linkHref={card.linkHref}
                      />
                    ))}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            {activities.ctaLink && activities.ctaText && (
              <FadeIn delay={0.3}>
                <div className="center-cta-wrap impact-cta">
                  <Link className="outline-btn" href={activities.ctaLink}>
                    {activities.ctaText}
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>
        </section>

        <section
          className="academy full-width-border-top"
          id="community"
        >
          {academy.showBackground !== false && (() => {
            const customBackground = typeof academy.backgroundImage === "string" ? academy.backgroundImage.trim() : "";
            const backgroundImage = customBackground || "/images/projects/items/academy/icon/project-academy.webp";
            const isFallback = !customBackground;
            return (
              <div
                className={`academy-bg${isFallback ? " academy-bg--fallback" : ""}`}
                style={{
                  backgroundImage: `url('${backgroundImage}')`,
                  backgroundSize: isFallback ? "contain" : "cover",
                  filter: isFallback ? "blur(18px)" : undefined,
                  opacity: isFallback ? 0.72 : undefined,
                  transform: isFallback ? "scale(1.15)" : undefined,
                }}
                aria-hidden="true"
              />
            );
          })()}
          <div className="academy-overlay" aria-hidden="true" />
          <div className="academy-inner">
            <FadeIn><SectionTitle title={academy.title} /></FadeIn>
            <StaggerContainer className="academy-grid" stagger={0.1}>
              {(academy.cards ?? []).map((card, index) => (
                <StaggerItem
                  as="a"
                  key={`${card.title}-${index}`}
                  className="academy-card academy-video-card"
                  href={card.link ?? `https://www.youtube.com/watch?v=${card.videoId ?? ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={card.title}
                >
                  <img src={card.image} alt={card.title} loading="lazy" />
                  <span className="academy-play-wrap">
                    <span className="academy-play-icon">
                      <PlayIcon />
                    </span>
                  </span>
                </StaggerItem>
              ))}
            </StaggerContainer>
            {academy.ctaLink && academy.ctaText && (
              <FadeIn delay={0.2}>
                <div className="center-cta-wrap">
                  <a
                    className="outline-btn"
                    href={academy.ctaLink.trim()}
                    {...externalAnchorRelProps(academy.ctaLink)}
                  >
                    {academy.ctaText}
                  </a>
                </div>
              </FadeIn>
            )}
          </div>
        </section>

        <section className="ecosystem" id="ecosystem">
          {ecosystem.snapshotMode && ecosystem.diagramImage ? (
            <>
              <FadeIn><SectionTitle title={ecosystem.title} subtitle={ecosystem.subtitle} /></FadeIn>
              <ScaleIn>
                <div className="ecosystem-full-shot">
                  <img src={ecosystem.diagramImage} alt="Privacy ecosystem" />
                </div>
              </ScaleIn>
            </>
          ) : (
            <>
              <FadeIn><SectionTitle title={ecosystem.title} subtitle={ecosystem.subtitle} /></FadeIn>
              {ecosystem.topLabel && ecosystem.middleLabel && (
                <FadeIn direction="left" delay={0.15}>
                  <div className="ecosystem-rail">
                    <span>{ecosystem.topLabel}</span>
                    <div className="ecosystem-beam" />
                    <span>{ecosystem.middleLabel}</span>
                  </div>
                </FadeIn>
              )}
              {ecosystem.diagramImage && (
                <ScaleIn delay={0.1}>
                  <div className="ecosystem-snapshot">
                    <img src={ecosystem.diagramImage} alt="Privacy ecosystem diagram" />
                  </div>
                </ScaleIn>
              )}
              {(ecosystem.groups ?? []).length > 0 && (
                <StaggerContainer className="ecosystem-groups" stagger={0.1}>
                  {(ecosystem.groups ?? []).map((group) => (
                    <StaggerItem as="article" key={group.title} className="eco-card">
                      <h4>{group.title}</h4>
                      <div className="eco-items">
                        {group.items.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </>
          )}
        </section>

        <section className="testimonials" id="testimonials">
          <FadeIn><SectionTitle title={testimonials.title} /></FadeIn>
          <div
            className={`testimonial-stack ${showAllTestimonials ? "is-expanded" : "is-collapsed"}`}
          >
            <div className="testimonial-masonry">
              {testimonialColumns.map((column, colIndex) => (
                <StaggerContainer
                  key={colIndex}
                  className="testimonial-masonry-column"
                  stagger={0.03}
                  viewportAmount={0.05}
                  instant={testimonialsInstantMotion}
                >
                  {column.map((item, rowIndex) => (
                    <StaggerItem
                      as="article"
                      key={`${item.name ?? "t"}-${colIndex}-${rowIndex}`}
                      className="testimonial-card"
                    >
                      <header>
                        <img src={item.image} alt={item.name} />
                        <div>
                          <h5>{item.name}</h5>
                          <p>{item.role}</p>
                        </div>
                      </header>
                      <p>{item.quote}</p>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ))}
            </div>
            {!showAllTestimonials && <div className="testimonial-fade" aria-hidden />}
          </div>
          {!showAllTestimonials && (
            <FadeIn>
              <div className="testimonials-cta">
                <button
                  className="outline-btn testimonials-show-more"
                  type="button"
                  onClick={() => setShowAllTestimonials(true)}
                >
                  READ ALL TESTIMONIALS
                </button>
              </div>
            </FadeIn>
          )}
        </section>
      </div>
    </main>
  );
}

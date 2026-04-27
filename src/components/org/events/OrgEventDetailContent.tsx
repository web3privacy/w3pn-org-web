"use client";

import React, { useMemo, useState } from "react";
import { Shield, Sparkles, Music, FileText, Coffee, Film, Zap, Mic2, Globe, Users, Settings, Calendar, PartyPopper } from "lucide-react";
import { getCountryName, getEventTypeLabel, getEventTitle } from "@/lib/org/events-constants";
import type { EventItem, EventDetail } from "@/lib/org/events-types";
import type { Article } from "@/types/news";
import { EventDetailHeroLayout } from "@/components/events/event-detail/event-detail-hero-layout";
import { DetailSectionNav, type SectionNavItem } from "@/components/events/event-detail/detail-section-nav";
import { AboutGallerySection, type AboutGalleryImage } from "@/components/org/AboutGallery";
import { OrgEventDetailArticles } from "./OrgEventDetailArticles";

function sanitizeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");
}

function stripMarkdownLink(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const experienceIconMap: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  shield: Shield,
  sparkles: Sparkles,
  music: Music,
  filetext: FileText,
  coffee: Coffee,
  film: Film,
  zap: Zap,
  mic: Mic2,
  globe: Globe,
  users: Users,
  settings: Settings,
  networking: Users,
  workshops: Settings,
  talks: Mic2,
  keynotes: Mic2,
  community: Users,
  calendar: Calendar,
  party: PartyPopper,
};

function renderExperienceIcon(icon: string): React.ReactNode {
  if (!icon) return <Shield className="event-detail-exp-card-icon" aria-hidden />;
  const trimmed = icon.trim();
  if (trimmed.startsWith("http") || trimmed.startsWith("/")) {
    return <img src={orgAsset(trimmed)} alt="" className="event-detail-exp-card-icon-img" aria-hidden />;
  }
  const key = trimmed.toLowerCase().replace(/\s+/g, "");
  const IconComp = experienceIconMap[key] ?? Shield;
  return <IconComp className="event-detail-exp-card-icon" aria-hidden />;
}

const linkIcons: Record<string, () => React.ReactNode> = {
  link: () => <Globe className="event-detail-link-icon-svg" aria-hidden />,
  doc: () => <FileText className="event-detail-link-icon-svg" aria-hidden />,
  github: () => <Globe className="event-detail-link-icon-svg" aria-hidden />,
  twitter: () => <Globe className="event-detail-link-icon-svg" aria-hidden />,
  discord: () => <Globe className="event-detail-link-icon-svg" aria-hidden />,
  telegram: () => <Globe className="event-detail-link-icon-svg" aria-hidden />,
};

function getLinkIcon(label: string, url?: string): string {
  const l = (label || "").toLowerCase();
  const u = (url || "").toLowerCase();
  if (l.includes("github") || u.includes("github.com")) return "github";
  if (l.includes("twitter") || l.includes("x.com") || u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (l.includes("discord") || u.includes("discord")) return "discord";
  if (l.includes("telegram") || u.includes("t.me")) return "telegram";
  if (l.includes("doc") || l.includes("documentation")) return "doc";
  return "link";
}

function getMapQueryFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q") || u.searchParams.get("query");
    if (q) return decodeURIComponent(q.replace(/\+/g, " "));
  } catch {
    /* ignore */
  }
  return null;
}

/** Short label for location website line (avoid long Google Maps URLs in the UI). */
function getLocationWebsiteLinkLabel(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("google.com/maps") ||
    lower.includes("maps.google.com") ||
    lower.startsWith("maps.google.")
  ) {
    return "View on Google Maps";
  }
  return trimmed.replace(/^https?:\/\//i, "");
}

function orgAsset(src: string | undefined): string {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("//") || src.startsWith("/images/") || src.startsWith("/org") || src.startsWith("/events/")) return src;
  return "/org" + (src.startsWith("/") ? src : `/${src}`);
}

function formatDateForHero(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = "JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC".split(",");
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

type VideoMeta = {
  youtubeId: string;
  title: string;
  speaker: string;
  role: string;
  event?: string;
  tags?: string[];
};

type OrgEventDetailContentProps = {
  event: EventItem;
  detail: EventDetail | null;
  titleOverride?: string;
  articles?: Article[];
  videosMeta?: VideoMeta[];
};

function showSection(sections: Record<string, boolean> | undefined, id: string): boolean {
  return sections?.[id] !== false;
}

type FaqExpandedState = Record<number, boolean>;

const SPEAKERS_PREVIEW_DESKTOP = 10;
const SPEAKERS_PREVIEW_MOBILE = 6;
const VIDEOS_PREVIEW_DESKTOP = 9;
const VIDEOS_PREVIEW_TABLET = 6;
const VIDEOS_PREVIEW_MOBILE = 4;
// Lines of text (~1.6 line-height * 14px ≈ 22px per line) to clamp before "Show more"
const TOPICS_LINE_CLAMP = 6;

export function OrgEventDetailContent({ event, detail, titleOverride, articles = [], videosMeta = [] }: OrgEventDetailContentProps) {
  const [speakersExpanded, setSpeakersExpanded] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [topicsOverflows, setTopicsOverflows] = useState(false);
  const topicsRef = React.useRef<HTMLDivElement>(null);
  const [speakersPreview, setSpeakersPreview] = useState(SPEAKERS_PREVIEW_DESKTOP);
  const [videosPreview, setVideosPreview] = useState(VIDEOS_PREVIEW_DESKTOP);

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSpeakersPreview(w <= 768 ? SPEAKERS_PREVIEW_MOBILE : SPEAKERS_PREVIEW_DESKTOP);
      setVideosPreview(w <= 768 ? VIDEOS_PREVIEW_MOBILE : w <= 1024 ? VIDEOS_PREVIEW_TABLET : VIDEOS_PREVIEW_DESKTOP);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const overrides = titleOverride != null ? { [event.id]: titleOverride } : {};
  const title = getEventTitle(event, overrides);
  const dateStr = formatDate(event.date);
  const countryName = getCountryName(event.country);
  const location = event.city ? `${event.city}${countryName ? `, ${countryName}` : ""}` : countryName;
  const profileImagePath =
    detail?.headerImageUrl ?? (event?.id ? `/images/events/items/${event.id}/header/${event.id}.webp` : undefined);
  const coverPath = detail?.heroBackgroundImageUrl?.trim();
  const buyUrl = detail?.tickets?.buyUrl ?? event.links?.rsvp ?? event.links?.web;

  const faqItems = detail?.faq?.items ?? [];
  const [faqExpanded, setFaqExpanded] = useState<FaqExpandedState>({});
  const faqCount = faqItems.length;

  const toggleFaq = (i: number) => setFaqExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Detect if topics content overflows the clamped height
  React.useEffect(() => {
    const el = topicsRef.current;
    if (!el) return;
    setTopicsOverflows(el.scrollHeight > el.clientHeight + 4);
  }, [detail?.topics?.content]);

  // Whether this is an upcoming event (Register link should only show for upcoming)
  const isUpcoming = event.status === "upcoming" || (!event.status && event.date && new Date(event.date) > new Date());

  const hasTopicsOrLinks = (detail?.topics?.enabled && detail.topics?.content) || (() => {
    const ll = detail?.links;
    if (Array.isArray(ll)) return ll.length >= 1;
    return ((ll as { custom?: unknown[] })?.custom?.length ?? 0) >= 1;
  })();
  const detailLinks: { label: string; url: string }[] = (() => {
    const ll = detail?.links;
    const raw: { label: string; url: string }[] = Array.isArray(ll)
      ? (ll as { label: string; url: string }[])
      : ((ll as { custom?: { label: string; url: string }[] })?.custom ?? []);
    // Hide "Register" link for past events
    return raw.filter((l) => {
      const isRegister = /^register$/i.test(l.label.trim());
      return isRegister ? isUpcoming : true;
    });
  })();
  const hasDetailLinks = detailLinks.length >= 1;
  const speakers = detail?.speakers as { id?: string; name?: string; role?: string; bio?: string; avatar?: string; twitter?: string }[] | undefined;
  const hasSpeakers = speakers && speakers.length >= 1;
  const exp = detail?.experience;
  const expContent = exp && (exp as { content?: string }).content;
  const expCards = exp && (exp as { cards?: unknown[] }).cards;
  const expThemes = exp && (exp as { themes?: string[] }).themes;
  const hasExpCards = expCards && expCards.length >= 1;
  const hasExpThemes = expThemes && expThemes.length >= 1;
  const hasExperience = detail?.experience?.enabled && (!!expContent || !!hasExpCards || !!hasExpThemes);
  const loc = detail?.location as {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    website?: string;
    mapUrl?: string;
    directions?: string;
  } | undefined;
  const hasLocation =
    loc &&
    (!!loc.name ||
      !!loc.address ||
      !!loc.city ||
      !!loc.country ||
      !!loc.website ||
      !!loc.mapUrl ||
      !!loc.directions);
  const hasEventMap = detail?.eventMap?.enabled && !!detail.eventMap?.imageUrl;
  const scheduleItems = (detail?.schedule as { items?: Array<{ time?: string; title?: string; speaker?: string; description?: string }> })?.items;
  const scheduleStages = (detail?.schedule as { stages?: Array<{ id: string; name: string; slots: Array<{ time: string; title: string; speaker?: string; description?: string }> }> })?.stages;
  const hasSchedule = detail?.schedule?.enabled && ((scheduleStages && scheduleStages.length >= 1) || (scheduleItems && scheduleItems.length >= 1));
  const galleryImages = (detail?.gallery as { images?: AboutGalleryImage[] })?.images;
  const hasGallery = detail?.gallery?.enabled && galleryImages && galleryImages.length >= 1;
  const ticketData = detail?.tickets as { buyUrl?: string; speakerContactUrl?: string; afterpartyUrl?: string } | undefined;
  const hasTickets = detail?.tickets?.enabled && !!ticketData?.buyUrl;
  const hasFaq = faqCount >= 1;
  const sponsorItems = (detail?.sponsors as { items?: Array<{ name: string; logo?: string; url?: string; twitter?: string; logoOnDark?: boolean }>; becomeSponsorEmail?: string })?.items;
  const becomeSponsorEmail = (detail?.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail ?? "info@web3privacy.info";
  const hasSponsors = detail?.sponsors?.enabled && sponsorItems && sponsorItems.length >= 1;
  const contributorItems = (detail?.contributors as { items?: Array<{ name: string; role?: string; avatar?: string }> })?.items;
  const hasContributors = detail?.contributors?.enabled && contributorItems && contributorItems.length >= 1;
  const articlesSection = detail?.articles as { enabled?: boolean; articleIds?: string[] } | undefined;
  const hasArticles = articlesSection?.enabled && (articlesSection.articleIds?.length ?? 0) >= 1;

  const heroProfileUrl = profileImagePath ? orgAsset(profileImagePath) : undefined;
  const heroCoverUrl = coverPath ? orgAsset(coverPath) : undefined;
  const dateStrHero = formatDateForHero(event.date);
  const detailLinksObj = detail?.links as { twitter?: string; luma?: string; web?: string } | undefined;
  const desc = (detail as { shortDescription?: string })?.shortDescription || null;
  const sections = useMemo(
    () => (detail?.sections ?? {}) as Record<string, boolean>,
    [detail?.sections]
  );

  const navItems = useMemo((): SectionNavItem[] => {
    const items: SectionNavItem[] = [];
    if (showSection(sections, "topicsLinks") && hasTopicsOrLinks) items.push({ id: "about", label: "About", href: "#topics-links" });
    if (showSection(sections, "speakers") && hasSpeakers) items.push({ id: "speakers", label: "Speakers", href: "#speakers" });
    if (showSection(sections, "schedule") && hasSchedule) items.push({ id: "schedule", label: "Schedule", href: "#schedule" });
    if (showSection(sections, "location") && hasLocation) items.push({ id: "location", label: "Location", href: "#location" });
    if (showSection(sections, "eventMap") && hasEventMap) items.push({ id: "map", label: "Map", href: "#event-map" });
    if (showSection(sections, "tickets") && hasTickets) items.push({ id: "register", label: "Register", href: "#tickets" });
    if (showSection(sections, "articles") && hasArticles) items.push({ id: "articles", label: "Articles", href: "#articles" });
    if (showSection(sections, "faq") && hasFaq) items.push({ id: "faq", label: "FAQ", href: "#faq" });
    return items;
  }, [sections, hasTopicsOrLinks, hasSpeakers, hasSchedule, hasLocation, hasEventMap, hasTickets, hasArticles, hasFaq]);

  const hasDetailMenu = navItems.length >= 3;

  return (
    <div
      role="main"
      className={`landing-root events-page event-detail-page${hasDetailMenu ? " event-detail-page--with-menu" : ""}`}
    >
      <div className="events-page-inner">
        <EventDetailHeroLayout
          backHref="/events"
          backLabel="All Events"
          title={title}
          dateStr={dateStrHero || dateStr}
          locationStr={location}
          headerImageUrl={heroProfileUrl}
          heroBackgroundImageUrl={heroCoverUrl}
          shortDescription={desc}
          highlights={[]}
          stats={[]}
          showPlaceholderTags={false}
          socialLinks={{
            twitter: detailLinksObj?.twitter,
            luma: detailLinksObj?.luma ?? event.links?.rsvp,
            web: detailLinksObj?.web ?? event.links?.web,
          }}
          buyUrl={buyUrl}
          addToCalendarUrl={detail?.addToCalendarUrl}
          mapUrl={loc?.mapUrl}
        />

        {hasDetailMenu && (
          <div className="events-content-wrap">
            <DetailSectionNav items={navItems} variant="dark" />
          </div>
        )}

        <div className="events-content-wrap event-detail-body">
          {showSection(sections, "topicsLinks") && hasTopicsOrLinks && (
            <section id="topics-links" className="event-detail-section event-detail-topics-links">
              <div className="event-detail-topics-links-grid">
                {detail?.topics?.enabled && detail.topics?.content && (
                  <div className="event-detail-topics-col">
                    <img src="/images/events/detail/assets/topics-heading.webp" alt="TOPICS" className="event-detail-topics-links-heading-img" width={160} height={32} />
                    <div
                      ref={topicsRef}
                      className={`event-detail-prose${topicsExpanded ? "" : " event-detail-prose--clamped"}`}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(detail.topics.content)) }}
                    />
                    {topicsOverflows && !topicsExpanded && (
                      <button type="button" className="event-detail-topics-links-show-more" onClick={() => setTopicsExpanded(true)}>
                        Show more
                      </button>
                    )}
                  </div>
                )}
                {hasDetailLinks && (
                  <div className="event-detail-links-col">
                    <img src="/images/events/detail/assets/links-heading.webp" alt="LINKS" className="event-detail-topics-links-heading-img" width={140} height={32} />
                    <ul className="event-detail-links">
                      {detailLinks.map((link, i) => {
                        const iconKey = getLinkIcon(link.label, link.url);
                        const Icon = linkIcons[iconKey] || linkIcons.link;
                        return (
                          <li key={i} className="event-detail-link-item">
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <span className="event-detail-link-icon"><Icon /></span>
                              {link.label.toUpperCase()}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
          {showSection(sections, "speakers") && hasSpeakers && (
            <section id="speakers" className="event-detail-section event-detail-speakers-section">
              <img src="/images/events/detail/assets/speakers-heading.webp" alt="SPEAKERS" className="event-detail-topics-links-heading-img" width={180} height={32} />
              <div className="event-detail-speakers-inner">
                <div className="event-detail-speakers about-team-grid about-team-grid--grayscale">
                  {(speakersExpanded ? speakers! : speakers!.slice(0, speakersPreview)).map((s) => (
                    <article key={s.id || s.name} className="about-team-member event-detail-speaker-card">
                      {s.avatar ? (
                        <img
                          src={orgAsset(s.avatar)}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const wrap = el.parentElement;
                            if (!wrap) return;
                            const ph = document.createElement("div");
                            ph.className = "event-detail-speaker-placeholder";
                            ph.setAttribute("aria-hidden", "true");
                            ph.textContent = (s.name || "?").charAt(0).toUpperCase();
                            wrap.replaceChild(ph, el);
                          }}
                        />
                      ) : (
                        <div className="event-detail-speaker-placeholder" aria-hidden>
                          {(s.name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h5>{s.name}</h5>
                      {s.role && <p>{s.role}</p>}
                      {s.bio && <p className="event-detail-speaker-bio">{s.bio}</p>}
                      {s.twitter && (
                        <a href={s.twitter} target="_blank" rel="noopener noreferrer" className="event-detail-speaker-twitter">
                          Twitter
                        </a>
                      )}
                    </article>
                  ))}
                </div>
                {speakers!.length > speakersPreview && (
                  <button
                    type="button"
                    onClick={() => setSpeakersExpanded((v) => !v)}
                    className="event-detail-speakers-show-all"
                  >
                    {speakersExpanded ? `Show less` : `Show all ${speakers!.length} speakers`}
                  </button>
                )}
              </div>
            </section>
          )}
          {showSection(sections, "experience") && hasExperience && (
            <section className="event-detail-section event-detail-experience-section">
              <img src="/images/events/detail/assets/experience-heading.webp" alt="EXPERIENCE" className="event-detail-topics-links-heading-img" width={220} height={40} />
              {expContent && !hasExpCards && (
                <div className="event-detail-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(expContent)) }} />
              )}
              {hasExpCards && (
                <div className="event-detail-experience-cards">
                  {(expCards as Array<{ icon?: string; title?: string; description?: string }>).map((card, i) => (
                    <article key={i} className="event-detail-experience-card">
                      <div className="event-detail-experience-card-header">
                        <span className="event-detail-exp-card-icon-wrap">{renderExperienceIcon(card.icon ?? "shield")}</span>
                        <h3 className="event-detail-experience-card-title">{card.title}</h3>
                      </div>
                      <p className="event-detail-experience-card-desc">{card.description}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {showSection(sections, "location") && hasLocation && (
            <section id="location" className="event-detail-section event-detail-location-section">
              <img src="/images/events/detail/assets/location-heading.webp" alt="LOCATION" className="event-detail-topics-links-heading-img event-detail-location-heading" width={200} height={40} />
              <div className="event-detail-location-grid">
                <div className="event-detail-location-map-wrap">
                  <iframe
                    title="Event location map"
                    className="event-detail-location-map"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      getMapQueryFromUrl(loc!.mapUrl) ||
                        [loc!.name, loc!.address, loc!.city, loc!.country].filter(Boolean).join(", ") ||
                        [event.place, event.city, countryName].filter(Boolean).join(", ") ||
                        "Brno Exhibition Centre"
                    )}&output=embed&t=m`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  {loc!.mapUrl && (
                    <a href={loc!.mapUrl} target="_blank" rel="noopener noreferrer" className="event-detail-location-view-map">
                      View on map
                    </a>
                  )}
                </div>
                <div className="event-detail-location-info">
                  {(loc!.name || event.place) && (
                    <h3 className="event-detail-location-name">{loc!.name || event.place}</h3>
                  )}
                  {(loc!.address || event["place-address"]) && (
                    <p className="event-detail-location-address">{loc!.address || event["place-address"]}</p>
                  )}
                  {(loc!.city || loc!.country || event.city || countryName) && (
                    <p className="event-detail-location-city">
                      {[loc!.city || event.city, loc!.country || countryName].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {loc!.website && (
                    <a href={loc!.website.startsWith("http") ? loc!.website : `https://${loc!.website}`} target="_blank" rel="noopener noreferrer" className="event-detail-location-website">
                      {getLocationWebsiteLinkLabel(loc!.website)}
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}
          {showSection(sections, "eventMap") && hasEventMap && detail?.eventMap?.imageUrl && (() => {
            const mapImageUrl = detail.eventMap!.imageUrl;
            const mapImgSrc = orgAsset(mapImageUrl.startsWith("/") || mapImageUrl.startsWith("http") || mapImageUrl.startsWith("//") ? mapImageUrl : `/${mapImageUrl}`);
            return (
            <section id="event-map" className="event-detail-section event-detail-event-map-section">
              <img src="/images/events/detail/assets/event-map-heading.webp" alt="EVENT MAP" className="event-detail-topics-links-heading-img" width={200} height={40} />
              <div className="event-detail-event-map">
                {loc?.mapUrl ? (
                  <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer" className="event-detail-event-map-link">
                    <img src={mapImgSrc} alt="Event venue map" loading="lazy" />
                  </a>
                ) : (
                  <div className="event-detail-event-map-link">
                    <img src={mapImgSrc} alt="Event venue map" loading="lazy" />
                  </div>
                )}
              </div>
            </section>
            );
          })()}
          {showSection(sections, "schedule") && hasSchedule && (scheduleStages?.length ? (
            <section id="schedule" className="event-detail-section event-detail-schedule-section">
              <img src="/images/events/detail/assets/schedule-heading.webp" alt="SCHEDULE" className="event-detail-topics-links-heading-img" width={200} height={40} />
              <div className="event-detail-schedule-tabs" role="tablist" aria-label="Program stages">
                {scheduleStages.map((stage, i) => (
                  <button
                    key={stage.id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeStageIndex}
                    aria-controls={`schedule-panel-${stage.id}`}
                    id={`schedule-tab-${stage.id}`}
                    onClick={() => setActiveStageIndex(i)}
                    className={`event-detail-schedule-tab ${i === activeStageIndex ? "event-detail-schedule-tab--active" : ""}`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
              <div className="event-detail-schedule-panels">
                {scheduleStages.map((stage, i) => (
                  <div
                    key={stage.id}
                    id={`schedule-panel-${stage.id}`}
                    role="tabpanel"
                    aria-labelledby={`schedule-tab-${stage.id}`}
                    hidden={i !== activeStageIndex}
                    className="event-detail-schedule-panel"
                  >
                    <ul className="event-detail-schedule-slots">
                      {stage.slots.map((slot, j) => (
                        <li key={j} className="event-detail-schedule-slot">
                          <span className="event-detail-schedule-time-box">{slot.time}</span>
                          <div className="event-detail-schedule-slot-content">
                            <span className="event-detail-schedule-slot-title">{slot.title}</span>
                            {slot.speaker && <span className="event-detail-schedule-slot-speaker">{slot.speaker}</span>}
                            {slot.description && <p className="event-detail-schedule-slot-desc">{slot.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : scheduleItems ? (
            <section id="schedule" className="event-detail-section event-detail-schedule-section">
              <img src="/images/events/detail/assets/schedule-heading.webp" alt="SCHEDULE" className="event-detail-topics-links-heading-img" width={200} height={40} />
              <ul className="event-detail-schedule event-detail-schedule--legacy">
                {scheduleItems.map((item, i) => (
                  <li key={i}>
                    <span className="event-detail-schedule-time">{item.time}</span>
                    <span className="event-detail-schedule-title">{item.title}</span>
                    {item.speaker && <span className="event-detail-schedule-speaker">{item.speaker}</span>}
                    {(item as { description?: string }).description && <p className="event-detail-schedule-slot-desc">{(item as { description?: string }).description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ) : null)}
          {showSection(sections, "gallery") && hasGallery && galleryImages && (
            <AboutGallerySection
              layout="eventGrid"
              gallery={{
                images: galleryImages.map((img): AboutGalleryImage =>
                  typeof img === "string"
                    ? orgAsset(img)
                    : {
                        ...img,
                        url: img.url ? orgAsset(img.url) : undefined,
                        thumbnailUrl: img.thumbnailUrl ? orgAsset(img.thumbnailUrl) : undefined,
                        previewUrl: img.previewUrl ? orgAsset(img.previewUrl) : undefined,
                        fullSizeUrl: img.fullSizeUrl ? orgAsset(img.fullSizeUrl) : undefined,
                      }
                ),
              }}
              titleNode={
                <img
                  src="/images/events/detail/assets/gallery-heading.webp"
                  alt="GALLERY"
                  className="event-detail-section-title event-detail-topics-links-heading-img"
                  width={200}
                  height={40}
                />
              }
              sectionClassName="event-detail-section"
            />
          )}
          {showSection(sections, "tickets") && hasTickets && ticketData?.buyUrl && (
            <section id="tickets" className="event-detail-section event-detail-tickets-section">
              <img src="/images/events/detail/assets/tickets-heading.webp" alt="TICKETS" className="event-detail-topics-links-heading-img" width={200} height={40} />
              <div className="event-detail-tickets-cards">
                <article className="event-detail-tickets-card event-detail-tickets-card--guest">
                  <div className="event-detail-tickets-card-content">
                    <h3 className="event-detail-tickets-card-title">REGISTRATION</h3>
                    <p className="event-detail-tickets-card-desc">
                      Use the official registration link for the latest attendance details and updates for this event.
                    </p>
                    <a href={ticketData.buyUrl} className="event-detail-tickets-btn event-detail-tickets-btn--primary" target="_blank" rel="noopener noreferrer">
                      REGISTER AS GUEST
                      <span className="event-detail-tickets-btn-arrow" aria-hidden>→</span>
                    </a>
                  </div>
                  <div className="event-detail-tickets-card-illustration">
                    {detail?.tickets?.guestCardImageUrl ? (
                      <img src={orgAsset(detail.tickets.guestCardImageUrl)} alt="" loading="lazy" />
                    ) : heroProfileUrl ? (
                      <img src={heroProfileUrl} alt="" loading="lazy" />
                    ) : (
                      <div className="event-detail-tickets-card-illustration-placeholder" aria-hidden />
                    )}
                  </div>
                </article>
                {ticketData.speakerContactUrl && (
                  <article className="event-detail-tickets-card event-detail-tickets-card--row">
                    <h3 className="event-detail-tickets-card-title">REGISTER AS SPEAKER</h3>
                    <a href={ticketData.speakerContactUrl} className="event-detail-tickets-btn event-detail-tickets-btn--outline" target="_blank" rel="noopener noreferrer">
                      CONTACT US
                      <span className="event-detail-tickets-btn-arrow" aria-hidden>→</span>
                    </a>
                  </article>
                )}
                {ticketData.afterpartyUrl && (
                  <article className="event-detail-tickets-card event-detail-tickets-card--row">
                    <h3 className="event-detail-tickets-card-title">AFTERPARTY</h3>
                    <a href={ticketData.afterpartyUrl} className="event-detail-tickets-btn event-detail-tickets-btn--outline" target="_blank" rel="noopener noreferrer">
                      I WANT TO GO
                      <span className="event-detail-tickets-btn-arrow" aria-hidden>→</span>
                    </a>
                  </article>
                )}
              </div>
            </section>
          )}
          {showSection(sections, "videos") && detail?.videos?.enabled && videosMeta.length > 0 && (
          <section id="talks" className="event-detail-section event-detail-talks-section">
            <img src="/images/events/detail/assets/talks-heading.webp" alt="TALKS" className="event-detail-topics-links-heading-img" width={160} height={40} />
            <div className="event-detail-talks-grid">
              {(videosExpanded ? videosMeta : videosMeta.slice(0, videosPreview)).map((v, i) => (
                <div key={v.youtubeId || i} className="event-detail-talk-card">
                  <div className="event-detail-talk-thumb">
                    {playingVideoId === v.youtubeId ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={v.title || "YouTube video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="event-detail-talk-iframe"
                      />
                    ) : (
                      <button type="button" className="event-detail-talk-poster" onClick={() => setPlayingVideoId(v.youtubeId)}>
                        <img src={`https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`} alt={v.title || ""} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`; }} />
                        <span className="event-detail-talk-play" aria-hidden>
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.7)" /><path d="M20 16v16l14-8-14-8z" fill="#fff" /></svg>
                        </span>
                      </button>
                    )}
                  </div>
                  <h4 className="event-detail-talk-speaker">{v.speaker || "Speaker"}</h4>
                  {v.role && <p className="event-detail-talk-role">{v.role}</p>}
                  {v.title && <p className="event-detail-talk-title">&ldquo;{v.title}&rdquo;</p>}
                  <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="event-detail-talk-yt-link">Watch on YouTube</a>
                </div>
              ))}
            </div>
            {videosMeta.length > videosPreview && (
              <div className="event-detail-talks-show-all-wrap">
                <button
                  type="button"
                  onClick={() => setVideosExpanded((prev) => !prev)}
                  className="event-detail-speakers-show-all"
                >
                  {videosExpanded ? "Show less" : `Show all ${videosMeta.length} videos`}
                </button>
              </div>
            )}
          </section>
          )}
          {showSection(sections, "articles") && hasArticles && articlesSection && (
            <OrgEventDetailArticles
              section={articlesSection as { enabled: boolean; articleIds: string[] }}
              articles={articles}
            />
          )}
          {showSection(sections, "faq") && hasFaq && (
            <section id="faq" className="event-detail-section">
              <div className="event-detail-faq-header">
                <img src="/images/events/detail/assets/faq-heading.webp" alt="FAQ" className="event-detail-faq-heading-img" width={120} height={48} />
              </div>
              <div className="event-detail-faq-accordion">
                {faqItems.map((item, i) => (
                  <div key={i} className={`event-detail-faq-item ${faqExpanded[i] ? "is-open" : ""}`}>
                    <button type="button" className="event-detail-faq-trigger" onClick={() => toggleFaq(i)} aria-expanded={!!faqExpanded[i]}>
                      <span className="event-detail-faq-question">{item.question}</span>
                      <span className="event-detail-faq-icon" aria-hidden>{faqExpanded[i] ? "⌃" : "⌄"}</span>
                    </button>
                    <div className="event-detail-faq-panel" hidden={!faqExpanded[i]}>
                      <div className="event-detail-faq-answer">{item.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {showSection(sections, "sponsors") && hasSponsors && sponsorItems && (
            <section id="sponsors" className="event-detail-section event-detail-sponsors-section">
              <div className="event-detail-sponsors-inner">
                <div className="event-detail-sponsors-header">
                  <img src="/images/events/detail/assets/sponsors-heading.webp" alt="SPONSORS" className="event-detail-topics-links-heading-img event-detail-sponsors-heading" width={200} height={40} />
                  <a
                    href={`mailto:${becomeSponsorEmail}`}
                    className="event-detail-sponsors-become-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    BECOME SPONSOR
                    <span className="event-detail-sponsors-become-arrow" aria-hidden>→</span>
                  </a>
                </div>
                <div className="event-detail-sponsors-grid">
                {sponsorItems.map((s, i) => (
                  <a
                    key={i}
                    href={s.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-detail-sponsor-card"
                  >
                    <div className={`event-detail-sponsor-logo-wrap ${s.logoOnDark ? "event-detail-sponsor-logo-wrap--dark" : ""}`}>
                      {s.logo ? (
                        <img src={orgAsset(s.logo)} alt="" loading="lazy" />
                      ) : (
                        <span className="event-detail-sponsor-placeholder">{s.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="event-detail-sponsor-name">{s.name.toUpperCase()}</span>
                    {s.twitter && (
                      <span className="event-detail-sponsor-twitter">{s.twitter.startsWith("@") ? s.twitter : `@${s.twitter}`}</span>
                    )}
                  </a>
                ))}
                </div>
              </div>
            </section>
          )}
          {showSection(sections, "contributors") && hasContributors && contributorItems && (
            <section id="contributors" className="event-detail-section event-detail-contributors-section">
              <img src="/images/events/detail/assets/contributors-heading.webp" alt="CONTRIBUTORS" className="event-detail-topics-links-heading-img event-detail-contributors-heading" width={200} height={40} />
              <div className="event-detail-contributors-inner">
              <div className="event-detail-contributors-grid">
                {contributorItems.map((c, i) => {
                  const contrib = c as { name: string; role?: string; avatar?: string; handle?: string };
                  const raw = (contrib.handle ?? contrib.role)?.trim();
                  const handle = raw ? (raw.startsWith("@") ? raw : `@${raw}`) : null;
                  return (
                    <article key={i} className="event-detail-contributor-card">
                      <div className="event-detail-contributor-avatar-wrap">
                        {contrib.avatar ? (
                          <img src={orgAsset(contrib.avatar)} alt="" width={64} height={64} loading="lazy" className="event-detail-contributor-avatar" />
                        ) : (
                          <div className="event-detail-contributor-placeholder" aria-hidden>
                            {(contrib.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="event-detail-contributor-info">
                        <strong className="event-detail-contributor-name">{contrib.name.toUpperCase()}</strong>
                        {handle && <span className="event-detail-contributor-handle">{handle}</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

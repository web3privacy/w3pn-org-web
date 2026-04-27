"use client";

import Link from "next/link";
import { ChevronLeft, Share2, Send, ExternalLink } from "lucide-react";
import { useRef, useEffect, useState } from "react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const DEFAULT_EVENT_STATS: { value: string; label: string }[] = [
  { value: "300+", label: "EVENT VISITORS" },
  { value: "64", label: "SPEAKERS" },
  { value: "150", label: "REGISTRATIONS" },
];

export type EventDetailHeroLayoutProps = {
  backHref: string;
  backLabel: string;
  title: string;
  dateStr: string;
  locationStr: string;
  /** Profile / logo in hero circle (and default blurred bg when heroBackgroundImageUrl omitted) */
  headerImageUrl?: string | null;
  /** Wide blurred background; if omitted, headerImageUrl is used for the blur */
  heroBackgroundImageUrl?: string | null;
  shortDescription?: string | null;
  highlights?: string[];
  stats?: { value: string; label: string }[];
  showPlaceholderTags?: boolean;
  socialLinks?: {
    twitter?: string;
    luma?: string;
    web?: string;
  };
  onShare?: () => void;
  buyUrl?: string | null;
  addToCalendarUrl?: string | null;
  mapUrl?: string | null;
  adminEditHref?: string | null;
};

/** Height of the fixed .top-nav – must match global.css */
const NAV_H = 82;

function abbreviateCountryForNarrowMobile(location: string): string {
  const raw = location.trim();
  if (!raw) return raw;
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return raw;

  const country = parts[parts.length - 1].toUpperCase();
  const countryMap: Record<string, string> = {
    CZECHIA: "CZ",
    "CZECH REPUBLIC": "CZ",
    SLOVAKIA: "SK",
    AUSTRIA: "AT",
    GERMANY: "DE",
    POLAND: "PL",
    FRANCE: "FR",
    SPAIN: "ES",
    ITALY: "IT",
    PORTUGAL: "PT",
    "UNITED KINGDOM": "UK",
    UK: "UK",
    "UNITED STATES": "US",
    USA: "US",
    CANADA: "CA",
    NETHERLANDS: "NL",
    BELGIUM: "BE",
    SWITZERLAND: "CH",
    ONLINE: "ON",
  };

  const short = countryMap[country] ?? country.replace(/[^A-Z]/g, "").slice(0, 2);
  parts[parts.length - 1] = short || country.slice(0, 2);
  return parts.join(", ");
}

export function EventDetailHeroLayout({
  backHref,
  backLabel,
  title,
  dateStr,
  locationStr,
  headerImageUrl,
  heroBackgroundImageUrl,
  shortDescription,
  socialLinks = {},
  onShare,
  adminEditHref,
}: EventDetailHeroLayoutProps) {
  const { twitter: twitterUrl, luma: lumaUrl, web: webUrl } = socialLinks;
  const hasSocialLinks = !!(twitterUrl || lumaUrl || webUrl);
  const blurSrc = heroBackgroundImageUrl || headerImageUrl || null;
  const hasBlurBackground = !!blurSrc;
  /** Dedicated wide cover: responsive crop/fit in CSS (.event-detail-hero-bg-img--custom-cover); profile-only fallback keeps scaled blur */
  const useCustomCoverFit = !!heroBackgroundImageUrl;
  const hasProfileImage = !!headerImageUrl;
  const hasHeroImageRow = hasProfileImage;
  const hasShortDescription = !!shortDescription?.trim();
  const headerRef = useRef<HTMLElement>(null);
  const [showFloatingBack, setShowFloatingBack] = useState(false);
  const [isMobilePillsLayout, setIsMobilePillsLayout] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowFloatingBack(!entry.isIntersecting),
      { threshold: 0, root: null, rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobilePillsLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Detect if location+date pills are wrapping (different rows) on mobile
  const pillsRef = useRef<HTMLDivElement>(null);
  const [pillsWrapped, setPillsWrapped] = useState(true); // default: wrapped (most events will wrap)
  const displayLocationStr = isMobilePillsLayout ? abbreviateCountryForNarrowMobile(locationStr) : locationStr;

  useEffect(() => {
    const check = () => {
      const el = pillsRef.current;
      if (!el) return;
      const kids = Array.from(el.children) as HTMLElement[];
      if (kids.length < 2) { setPillsWrapped(false); return; }
      setPillsWrapped(kids[0].offsetTop !== kids[1].offsetTop);
    };
    check();
    const ro = new ResizeObserver(check);
    if (pillsRef.current) ro.observe(pillsRef.current);
    return () => ro.disconnect();
  }, [locationStr, dateStr]);

  return (
    <header ref={headerRef} className="relative">
      <Link
        href={backHref}
        className={`detail-hero-back-floating ${showFloatingBack ? "detail-hero-back-floating--visible" : ""}`}
        aria-hidden={showFloatingBack ? undefined : true}
        tabIndex={showFloatingBack ? 0 : -1}
      >
        <ChevronLeft className="h-4 w-4" style={{ flexShrink: 0 }} aria-hidden />
        {backLabel}
      </Link>
      {/*
       * Media wrap: pulled under the fixed nav with negative margin (same as .project-detail-hero-media-wrap).
       * margin-top: -NAV_H → media-wrap top is at Y=0 (page start, overlapping the nav area).
       * padding-top: NAV_H → in-flow children start at Y=NAV_H (just below nav). BG is absolute so it fills from Y=0.
       */}
      <div
        className="event-detail-hero-media-wrap"
        style={{ marginLeft: "calc(-50vw + 50%)" }}
      >
        {/* Background image / solid colour – fills the full media-wrap including under nav */}
        {hasBlurBackground ? (
          <div className="pointer-events-none absolute inset-0 z-0 bg-[#0c1117]">
            <img
              src={blurSrc!}
              alt=""
              className={
                useCustomCoverFit
                  ? "event-detail-hero-bg-img--custom-cover grayscale opacity-50"
                  : "absolute inset-0 h-full w-full scale-150 object-cover opacity-50 grayscale"
              }
              aria-hidden
            />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 z-0 bg-[#121212]" aria-hidden />
        )}

        {/* Nav fade – darkens the strip behind the fixed nav for readability */}
        <div className="event-detail-hero-nav-fade" aria-hidden />

        {/*
         * Back button bar – in-flow (not absolute), margin-top pushes it below the nav.
         * Mirrors .project-detail-hero-bar positioning.
         */}
        <div className="event-detail-hero-back-bar">
          <Link
            href={backHref}
            className={`event-detail-hero-back-link${showFloatingBack ? " event-detail-hero-back-link--concealed" : ""}`}
            tabIndex={showFloatingBack ? -1 : undefined}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            {backLabel}
          </Link>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="event-detail-hero-back-link"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Main hero content */}
        <div className="event-detail-hero-content-wrap">
          {/* Image + title/location/date/social — centered block */}
          <div
            className={`event-detail-hero-inner-row${hasHeroImageRow ? "" : " event-detail-hero-inner-row--no-image"}${hasShortDescription ? "" : " event-detail-hero-inner-row--no-desc"}`}
          >
            {hasProfileImage && (
              <div className="event-detail-hero-img-wrap">
                <div className="event-detail-hero-img-box">
                  <img src={headerImageUrl!} alt="" className="event-detail-hero-img" />
                </div>
              </div>
            )}

            {/* Meta: title / location+date / social */}
            <div className={`event-detail-hero-meta${hasHeroImageRow ? "" : " event-detail-hero-meta--centered"}`}>
              <h1
                className={`event-detail-hero-title${hasHeroImageRow ? "" : " event-detail-hero-title--standalone"}`}
                style={{
                  textShadow:
                    "0 0 1px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.3)",
                }}
              >
                {title}
              </h1>

              {/* Location + date pills */}
              <div className="event-detail-hero-pills" ref={pillsRef}>
                {locationStr && (
                  <p className={`event-detail-hero-pill${hasHeroImageRow
                    ? (pillsWrapped ? " event-detail-hero-pill--location-wrap" : " event-detail-hero-pill--location")
                    : (pillsWrapped ? " event-detail-hero-pill--location-solo-wrap" : " event-detail-hero-pill--location-solo")} event-detail-hero-pill--is-location`}>
                    {displayLocationStr}
                  </p>
                )}
                <p className={`event-detail-hero-pill${locationStr
                  ? (hasHeroImageRow
                      ? (pillsWrapped ? " event-detail-hero-pill--date-wrap" : " event-detail-hero-pill--date")
                      : (pillsWrapped ? " event-detail-hero-pill--date-solo-wrap" : " event-detail-hero-pill--date-solo"))
                  : " event-detail-hero-pill--date-only"} event-detail-hero-pill--is-date`}>
                  {dateStr}
                </p>
                {/* Social icon links */}
                {hasSocialLinks && (
                  <div className="event-detail-hero-social">
                    {twitterUrl && (
                      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="event-detail-hero-social-link" aria-label="Twitter / X">
                        <XIcon className="h-5 w-5" />
                      </a>
                    )}
                    {lumaUrl && (
                      <a href={lumaUrl} target="_blank" rel="noopener noreferrer" className="event-detail-hero-social-link" aria-label="Luma">
                        <Send className="h-5 w-5" />
                      </a>
                    )}
                    {webUrl && (
                      <a href={webUrl} target="_blank" rel="noopener noreferrer" className="event-detail-hero-social-link" aria-label="Website">
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Short description – below image+meta, centred on desktop */}
          {hasShortDescription && (
            <p className="event-detail-hero-desc event-detail-hero-desc--with-content">
              {shortDescription}
            </p>
          )}
        </div>

        {adminEditHref && (
          <Link
            href={adminEditHref}
            className="absolute bottom-6 right-6 z-20 text-xs lowercase text-white/85 opacity-90 no-underline transition hover:text-white hover:opacity-100 md:right-8 md:bottom-8"
          >
            Admin
          </Link>
        )}

        {/* Bottom fade: transparent → black */}
        <div className="event-detail-hero-bottom-fade" aria-hidden />
      </div>

      {/* Divider line */}
      <div
        className="mt-6 md:mt-0 w-screen border-t border-white/20 opacity-50"
        style={{ marginLeft: "calc(-50vw + 50%)" }}
        aria-hidden
      />
    </header>
  );
}

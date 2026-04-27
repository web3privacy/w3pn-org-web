"use client";

import Image from "next/image";
import Link from "next/link";
import { passthroughImageLoader } from "@/lib/passthrough-image-loader";
import { getCountryName, getEventTypeLabel, getEventTitle } from "@/lib/org/events-constants";

function stripMarkdownLink(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LEGACY_EVENT_CARD_IMAGES = new Set([
  "amsterdam01",
  "berlin03",
  "brussels01",
  "bucharest01",
  "rome01",
  "rome02",
]);

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Image: event detail header, legacy listing image, or event-specific header under /images. */
function getEventImageUrl(
  event: { id: string; design?: { image?: string } },
  detail?: { headerImageUrl?: string }
): string {
  const fromDetail = detail?.headerImageUrl;
  if (fromDetail?.startsWith("http") || fromDetail?.startsWith("//")) return fromDetail;
  if (fromDetail?.startsWith("/")) return fromDetail;
  if (fromDetail) return `/images/${fromDetail.replace(/^\/+/, "")}`;
  const img = event.design?.image;
  if (img?.startsWith("http") || img?.startsWith("//") || img?.startsWith("/")) return img;
  if (img && LEGACY_EVENT_CARD_IMAGES.has(img)) {
    return `/images/events/legacy/${img}.webp`;
  }
  return `/images/events/items/${event.id}/header/${event.id}.webp`;
}

type Event = {
  id: string;
  title?: string;
  type?: string;
  city?: string;
  country?: string;
  date?: string;
  place?: string;
  premium?: boolean;
  design?: { image?: string };
  links?: { web?: string; rsvp?: string };
};

export function EventCardOrg({
  event,
  override = {},
  detail,
  isPast = false,
}: {
  event: Event;
  override?: Record<string, string>;
  detail?: { headerImageUrl?: string };
  isPast?: boolean;
}) {
  const title = getEventTitle(event, override);
  const dateStr = formatDate(event.date);
  const countryName = getCountryName(event.country);
  const placeDisplay = event.place ? stripMarkdownLink(event.place) : null;
  const typeLabel = getEventTypeLabel(event.type);
  const webUrl = event.links?.web;
  const rsvpUrl = event.links?.rsvp;
  const actionUrl = webUrl || rsvpUrl;
  const actionLabel = webUrl ? "Website" : rsvpUrl ? "Lu.ma" : null;
  const profileHref = `/events/${event.id}`;
  const imageUrl = getEventImageUrl(event, detail);
  const isPremium = event.premium === true || event.type === "premium";

  return (
    <div
      className={`event-card-org${isPremium ? " is-premium" : ""}`}
      style={{ display: "block" }}
    >
      <div className="event-card-org-inner">
        <Link
          href={profileHref}
          className="event-card-org-main-link"
          style={{ display: "contents", textDecoration: "none", color: "inherit" }}
        >
          <div className="event-card-org-media">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                loader={passthroughImageLoader}
                sizes="(max-width: 1024px) 120px, 144px"
                unoptimized
              />
            ) : (
              <div className="event-card-org-media-placeholder" aria-hidden />
            )}
          </div>
          <div className="event-card-org-body">
            <h3 className="event-card-org-title">{title}</h3>
            {dateStr && <p className="event-card-org-date">{dateStr}</p>}
            {(placeDisplay || event.city || event.country) && (
              <div className="event-card-org-meta-row">
                {placeDisplay && <span><span className="event-card-org-venue-prefix">Venue: </span>{placeDisplay}</span>}
                {placeDisplay && (event.city || event.country) && " · "}
                <span className="event-card-org-location">
                  {event.city}
                  {event.city && countryName ? `, ${countryName}` : countryName}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div className="event-card-org-actions">
          <span className="event-card-org-type-pill">{typeLabel}</span>
          {actionUrl && actionLabel && (
            <a
              href={actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="event-card-org-link"
              aria-label={actionLabel}
            >
              <span className="event-card-org-link-text">{actionLabel}</span>
              <span className="event-card-org-link-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

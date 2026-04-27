import { notFound } from "next/navigation";
import { getEventById, getEventDetailById } from "@/lib/org/events-data";
import { getOrgDefaultContent } from "@/lib/org/default-content";
import { loadNewsData } from "@/lib/news";
import type { Article } from "@/types/news";
import { OrgEventDetailContent } from "@/components/org/events/OrgEventDetailContent";
import { getVideosMeta } from "@/lib/video-catalog";
import { absoluteUrl, buildMetadata, SITE_NAME, SITE_URL } from "@/lib/site-config";
import { getCountryName, getEventTitle, getEventTypeLabel } from "@/lib/org/events-constants";
import type { EventDetail, EventItem } from "@/lib/org/events-data";

function getEventOverrides() {
  const content = getOrgDefaultContent();
  return (content?.eventsPage as { eventsOverrides?: Record<string, string> })?.eventsOverrides ?? {};
}

function metadataImagePath(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) return raw;
  return raw.startsWith("org/") ? `/${raw}` : `/org/${raw.replace(/^\/+/, "")}`;
}

function formatEventDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function buildEventDescription(eventId: string, event: EventItem | null, detail: EventDetail | null, title: string) {
  const shortDescription = detail?.shortDescription;
  const eventDescription = event?.description;
  if (shortDescription) return shortDescription;
  if (eventDescription) return eventDescription;

  const city = event?.city;
  const date = formatEventDate(event?.date);
  const type = getEventTypeLabel(event?.type) || "event";
  return [title, date ? `on ${date}` : null, city ? `in ${city}` : null]
    .filter(Boolean)
    .join(" ")
    .replace(title, `${title} is a ${type.toLowerCase()} on privacy, digital rights, and public goods`)
    || `Explore the ${eventId} event.`;
}

function stripMarkdownLink(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEventById(eventId);
  const detail = getEventDetailById(eventId);
  const overrides = getEventOverrides();
  const name = event ? getEventTitle(event, overrides) : eventId;
  const description = buildEventDescription(eventId, event, detail, name);
  const shareImage =
    metadataImagePath(detail?.headerImageUrl) ??
    metadataImagePath((detail as { heroBackgroundImageUrl?: string } | null)?.heroBackgroundImageUrl);

  return buildMetadata({
    title: name,
    description,
    path: `/events/${eventId}`,
    type: "article",
    images: shareImage ? [shareImage] : undefined,
  });
}

export default async function OrgEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = getEventById(eventId);
  const detail = getEventDetailById(eventId);

  if (!event) notFound();

  const eventsOverrides = getEventOverrides();
  const titleOverride = eventsOverrides[eventId];
  const eventTitle = getEventTitle(event, eventsOverrides);
  const eventDescription = buildEventDescription(eventId, event, detail, eventTitle);
  const shareImage =
    metadataImagePath(detail?.headerImageUrl) ??
    metadataImagePath((detail as { heroBackgroundImageUrl?: string } | null)?.heroBackgroundImageUrl);
  const locationName = stripMarkdownLink(typeof event.place === "string" ? event.place : undefined);
  const locationAddress =
    typeof event["place-address"] === "string"
      ? event["place-address"]
      : [event.city, getCountryName(event.country)].filter(Boolean).join(", ");
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventTitle,
    description: eventDescription,
    url: absoluteUrl(`/events/${eventId}`),
    image: shareImage ? [absoluteUrl(shareImage)] : undefined,
    startDate: event.date,
    eventAttendanceMode:
      String(event.country ?? "").toLowerCase() === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: event.confirmed
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventPostponed",
    location: locationName || locationAddress
      ? {
          "@type": "Place",
          name: locationName ?? locationAddress,
          address: locationAddress || undefined,
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    offers: detail?.tickets?.buyUrl
      ? {
          "@type": "Offer",
          url: detail.tickets.buyUrl,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: absoluteUrl("/events"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: eventTitle,
        item: absoluteUrl(`/events/${eventId}`),
      },
    ],
  };

  let articles: Article[] = [];
  try {
    const news = loadNewsData();
    articles = news.articles ?? [];
  } catch {
    // News data unavailable – articles section will be empty
  }

  const youtubeIds = (detail?.videos as { youtubeIds?: string[] })?.youtubeIds ?? [];
  const videosMeta = youtubeIds.length > 0 ? getVideosMeta(youtubeIds) : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <OrgEventDetailContent
        event={event}
        detail={detail}
        titleOverride={titleOverride}
        articles={articles}
        videosMeta={videosMeta}
      />
    </>
  );
}

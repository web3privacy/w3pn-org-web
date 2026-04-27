/**
 * Shared constants and helpers for event display: country name lookups,
 * event type labels, date-based filtering, and title formatting.
 */

/** Country code (ISO 3166-1 alpha-2) to display name – aligned with Portal */
export const COUNTRY_NAMES: Record<string, string> = {
  in: "India",
  de: "Germany",
  ar: "Argentina",
  it: "Italy",
  cz: "Czechia",
  nl: "Netherlands",
  ro: "Romania",
  th: "Thailand",
  be: "Belgium",
  es: "Spain",
  pl: "Poland",
  si: "Slovenia",
  us: "USA",
  at: "Austria",
  fr: "France",
  gb: "United Kingdom",
  uk: "United Kingdom",
  pt: "Portugal",
  ch: "Switzerland",
  cn: "China",
  tw: "Taiwan",
  jp: "Japan",
  br: "Brazil",
  mx: "Mexico",
  xx: "Online",
  online: "Online",
};

export function getCountryName(code: string | undefined): string {
  return COUNTRY_NAMES[code?.toLowerCase() ?? ""] ?? (code ? code.toUpperCase() : "");
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  congress: "Congress",
  summit: "Summit",
  meetup: "Meetup",
  collab: "Collab",
  rave: "Rave",
  hackathon: "Hackathon",
  privacycorner: "Privacy Corner",
  online: "Online",
};

export function getEventTypeLabel(type: string | undefined): string {
  return (type && EVENT_TYPE_LABELS[type]) ?? type ?? "";
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isUpcoming(event: { date?: string }): boolean {
  const d = new Date(event.date ?? "");
  d.setHours(0, 0, 0, 0);
  return !isNaN(d.getTime()) && d >= getToday();
}

export function sortEventsByDate(
  events: { date?: string }[],
  ascending: boolean
): { date?: string }[] {
  return [...events].sort((a, b) => {
    const da = new Date(a.date ?? "").getTime();
    const db = new Date(b.date ?? "").getTime();
    return ascending ? da - db : db - da;
  });
}

type EventLike = { id?: string; title?: string; type?: string; city?: string };
type Overrides = Record<string, string>;

export function getEventTitle(event: EventLike, overrides: Overrides = {}): string {
  const id = event.id;
  const override = id ? overrides[id] : undefined;
  return override ?? event.title ?? `${getEventTypeLabel(event.type)} ${event.city ?? ""}`.trim();
}

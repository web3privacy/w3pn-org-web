/**
 * Event types – 1:1 schema from web3privacy/data events (v7).
 * Optional "premium" for highlighted card with custom background.
 */

export type EventType =
  | "congress"
  | "summit"
  | "meetup"
  | "collab"
  | "rave"
  | "hackathon"
  | "privacycorner"
  | "online";

export type EventStatus =
  | "confirmed"
  | "past"
  | "upcoming"
  | "registration"
  | "draft"
  | "cancelled";

export interface EventLinks {
  rsvp?: string;
  web?: string;
  page?: string;
  website?: string;
  source?: string;
  archive?: string;
  [key: string]: string | undefined;
}

export interface EventDesign {
  image?: string;
  background?: string;
}

export interface EventAttendee {
  avatar?: string;
  name?: string;
  id?: string;
}

export interface EventSpeakerRef {
  name: string;
  slug?: string;
  affiliation?: string;
  note?: string;
  "twitter-handle"?: string;
  avatarUrl?: string;
  imageUrl?: string;
  refs?: Record<string, string>;
  "social-source"?: string;
}

export interface EventHost {
  name: string;
  slug?: string;
  role?: string;
  affiliation?: string;
  "twitter-handle"?: string;
  avatarUrl?: string;
  refs?: Record<string, string>;
}

export interface EventProgramItem {
  title: string;
  description?: string;
}

export interface EventScheduleItem {
  start?: string;
  end?: string;
  title: string;
  speaker?: string;
  note?: string;
}

export interface Event {
  id: string;
  type: EventType;
  date: string;
  city: string;
  country: string;
  title?: string;
  description?: string;
  place?: string;
  "place-address"?: string;
  confirmed?: boolean;
  coincidence?: string;
  status?: EventStatus;
  lead?: string;
  links?: EventLinks;
  speakers?: (string | EventSpeakerRef)[];
  "speakers-source"?: { kind?: string; url?: string } | string;
  "speakers-count"?: number;
  hosts?: EventHost[];
  helpers?: string[];
  optional?: boolean;
  days?: number;
  design?: EventDesign;
  premium?: boolean;
  attendees?: EventAttendee[];
  themes?: string[];
  "program-outline"?: EventProgramItem[];
  schedule?: EventScheduleItem[];
  "schedule-note"?: string;
}

export interface EventsData {
  events: Event[];
}

/** Event type to filter label (for UI pills) */
export const EVENT_TYPE_FILTERS: Record<string, EventType[]> = {
  all: [],
  conferences: ["congress", "summit"],
  meetups: ["meetup"],
  hackathons: ["hackathon"],
  "w3pn-only": ["collab", "privacycorner", "rave"],
  other: [],
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  all: "ALL EVENTS",
  conferences: "CONFERENCES",
  meetups: "MEETUPS",
  hackathons: "HACKATHONS",
  "w3pn-only": "W3PN ONLY",
  other: "OTHER",
};

/**
 * Shared types for org events (list + detail).
 * No Node/server deps – safe for client components.
 */

export interface EventSpeakerRef {
  name: string;
  slug?: string;
  affiliation?: string;
  "twitter-handle"?: string;
  avatarUrl?: string;
  imageUrl?: string;
  refs?: Record<string, string>;
}

export interface EventHost {
  name: string;
  slug?: string;
  role?: string;
  affiliation?: string;
  "twitter-handle"?: string;
  avatarUrl?: string;
}

export interface EventItem {
  id: string;
  type?: string;
  date?: string;
  city?: string;
  country?: string;
  title?: string;
  description?: string;
  place?: string;
  "place-address"?: string;
  confirmed?: boolean;
  coincidence?: string;
  status?: string;
  lead?: string;
  links?: { rsvp?: string; web?: string; page?: string; [key: string]: string | undefined };
  speakers?: (string | EventSpeakerRef)[];
  "speakers-count"?: number;
  hosts?: EventHost[];
  themes?: string[];
  "program-outline"?: { title: string; description?: string }[];
  schedule?: { start?: string; end?: string; title: string; speaker?: string; note?: string }[];
  "schedule-note"?: string;
  premium?: boolean;
  design?: { image?: string };
}

export type { EventDetail } from "@/types/event-detail";

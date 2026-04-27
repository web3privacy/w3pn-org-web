/**
 * Event detail – extended data for /events/[id] page.
 * Stored in data/events/details/[eventId].yaml
 */

export interface EventDetailTopics {
  enabled: boolean;
  /** Editable description content (markdown) – not categories/filtering */
  content: string;
}

export interface EventDetailSpeaker {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  bio?: string;
  twitter?: string;
}

export interface EventDetailLink {
  label: string;
  url: string;
}

export interface EventDetailExperienceCard {
  /** Lucide icon name, emoji, or image URL (starts with http or /) */
  icon: string;
  title: string;
  description: string;
}

export interface EventDetailExperience {
  enabled: boolean;
  title?: string;
  /** Markdown content – used when cards not set */
  content?: string;
  /** Card grid – used when set, overrides content */
  cards?: EventDetailExperienceCard[];
}

export interface EventDetailLocation {
  mapUrl?: string;
  directions?: string;
  /** Venue name (e.g. org event detail) */
  name?: string;
  /** Full address */
  address?: string;
  city?: string;
  country?: string;
  /** Venue website */
  website?: string;
}

export interface EventDetailEventMap {
  enabled: boolean;
  imageUrl: string;
}

export interface ScheduleSlot {
  time: string;
  title: string;
  speaker?: string;
  description?: string;
}

export interface EventDetailStage {
  id: string;
  name: string;
  slots: ScheduleSlot[];
}

export interface EventDetailSchedule {
  enabled: boolean;
  stages?: EventDetailStage[];
  items?: Array<{
    date?: string;
    time: string;
    title: string;
    stage?: string;
    speaker?: string;
    description?: string;
  }>;
}

export interface EventDetailGalleryImage {
  url?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  fullSizeUrl?: string;
  caption?: string;
}

export interface EventDetailGallery {
  enabled: boolean;
  images: EventDetailGalleryImage[];
}

export interface EventDetailTicketTier {
  name: string;
  price?: string;
  soldOut?: boolean;
}

export interface EventDetailTickets {
  enabled: boolean;
  buyUrl?: string;
  /** Optional image URL for guest/ticket card (e.g. org event detail) */
  guestCardImageUrl?: string;
  speakerContactUrl?: string;
  afterpartyUrl?: string;
  tiers?: EventDetailTicketTier[];
  saleEndsAt?: string; // ISO date for countdown
  totalTickets?: number;
  ticketsSold?: number;
}

export interface EventDetailVideos {
  enabled: boolean;
  source: "academy" | "manual";
  talkIds?: string[];
  youtubeIds?: string[];
}

export interface EventDetailArticles {
  enabled: boolean;
  articleIds: string[];
}

export interface EventDetailFaqItem {
  question: string;
  answer: string;
}

export interface EventDetailFaq {
  enabled: boolean;
  items: EventDetailFaqItem[];
}

export interface EventDetailSponsor {
  name: string;
  /** Twitter handle (e.g. @handle) */
  twitter?: string;
  logo?: string;
  /** If true, logo renders on black background without white square (for light/white logos) */
  logoOnDark?: boolean;
  url?: string;
  tier?: "gold" | "silver" | "bronze";
}

export interface EventDetailSponsors {
  enabled: boolean;
  /** Contact email for "Become a sponsor" CTA (e.g. org event detail) */
  becomeSponsorEmail?: string;
  items: EventDetailSponsor[];
}

export interface EventDetailContributor {
  name: string;
  avatar?: string;
  /** Display role or label; also used as @handle when handle is not set */
  role?: string;
  /** Twitter/username handle, e.g. "mykolasys" → @mykolasys */
  handle?: string;
}

export interface EventDetailContributors {
  enabled: boolean;
  items: EventDetailContributor[];
}

/** Editable stat item for hero (e.g. "300+ EVENT VISITORS") */
export interface EventDetailStatItem {
  value: string;
  label: string;
}

export interface EventDetailLinks {
  twitter?: string;
  discord?: string;
  telegram?: string;
  youtube?: string;
  custom?: EventDetailLink[];
}

export interface EventDetail {
  eventId: string;
  /** Profile image: listing card + hero circle (fallback /images/events/items/{id}/header/{id}.webp) */
  headerImageUrl?: string;
  /** Optional wide hero background; if unset, blurred profile image is used */
  heroBackgroundImageUrl?: string;
  /** Time range e.g. "14:00 - 22:00" */
  timeRange?: string;
  addToCalendarUrl?: string;
  agendaUrl?: string; // VIEW AGENDA – anchor or URL
  /** Short description for hero (e.g. org event detail) */
  shortDescription?: string;
  /** Bullet highlights (e.g. "300+ VISITORS") */
  highlights?: string[];
  /** Editable stats for hero (e.g. { value: "300+", label: "EVENT VISITORS" }) – white pill style */
  stats?: EventDetailStatItem[];
  topics?: EventDetailTopics;
  links?: EventDetailLinks;
  experience?: EventDetailExperience;
  location?: EventDetailLocation;
  eventMap?: EventDetailEventMap;
  schedule?: EventDetailSchedule;
  gallery?: EventDetailGallery;
  tickets?: EventDetailTickets;
  videos?: EventDetailVideos;
  articles?: EventDetailArticles;
  faq?: EventDetailFaq;
  sponsors?: EventDetailSponsors;
  contributors?: EventDetailContributors;
  speakers?: EventDetailSpeaker[];
  /** Per-section visibility: false = hide section on event detail page */
  sections?: Record<string, boolean>;
}

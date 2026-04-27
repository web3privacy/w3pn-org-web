import { z } from "zod";
import { isAllowedNewsletterActionUrl } from "@/lib/newsletter-action";
import { readDefaultContentFile } from "@/lib/org/default-content-file";
import type { Event } from "@/types/events";
import type { EventDetail } from "@/types/event-detail";

function undefineNull<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export class AdminValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "AdminValidationError";
  }
}

const FORBIDDEN_OBJECT_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const DANGEROUS_PROTOCOL = /^\s*(?:javascript|data|vbscript|file):/i;
const SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:/i;
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;
const URLISH_KEY_PATTERN = /(href|url|src|image|avatar|logo|thumbnail|background|download)$/i;
const URLISH_KEYS = new Set([
  "actionUrl",
  "addToCalendarUrl",
  "adminPath",
  "afterpartyUrl",
  "agendaUrl",
  "archive",
  "backgroundImage",
  "backgroundImageUrl",
  "buyUrl",
  "coverImage",
  "ctaHref",
  "ctaLink",
  "downloadUrl",
  "fullSizeUrl",
  "guestCardImageUrl",
  "headerImageUrl",
  "heroBackgroundImageUrl",
  "href",
  "image",
  "imageUrl",
  "link",
  "linkHref",
  "logo",
  "logoUrl",
  "mapUrl",
  "mediaUrl",
  "page",
  "posterUrl",
  "rsvp",
  "speakerContactUrl",
  "src",
  "thumbnail",
  "thumbnailUrl",
  "url",
  "videoThumbnail",
  "web",
  "website",
]);

const safeIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Identifier is required")
  .max(120, "Identifier is too long")
  .regex(IDENTIFIER_PATTERN, "Identifier may only contain letters, numbers, hyphens, and underscores");

const optionalStringSchema = z.string().nullish().transform(undefineNull);
const optionalBooleanSchema = z.boolean().nullish().transform(undefineNull);
const optionalNumberSchema = z.number().finite().nullish().transform(undefineNull);

const eventLinksSchema = z.record(z.string().nullish().transform(undefineNull)).nullish().transform(undefineNull);

const eventDesignSchema = z
  .object({
    image: optionalStringSchema,
    background: optionalStringSchema,
  })
  .passthrough()
  .nullish()
  .transform(undefineNull);

const eventAttendeeSchema = z
  .object({
    avatar: optionalStringSchema,
    name: optionalStringSchema,
    id: optionalStringSchema,
  })
  .passthrough();

const eventSpeakerRefSchema = z
  .object({
    name: z.string().trim().min(1, "Speaker name is required"),
    slug: optionalStringSchema,
    affiliation: optionalStringSchema,
    note: optionalStringSchema,
    "twitter-handle": optionalStringSchema,
    avatarUrl: optionalStringSchema,
    imageUrl: optionalStringSchema,
    refs: z.record(z.string()).optional(),
    "social-source": optionalStringSchema,
  })
  .passthrough();

const eventHostSchema = z
  .object({
    name: z.string().trim().min(1, "Host name is required"),
    slug: optionalStringSchema,
    role: optionalStringSchema,
    affiliation: optionalStringSchema,
    "twitter-handle": optionalStringSchema,
    avatarUrl: optionalStringSchema,
    refs: z.record(z.string()).optional(),
  })
  .passthrough();

const eventProgramItemSchema = z
  .object({
    title: z.string().trim().min(1, "Program item title is required"),
    description: optionalStringSchema,
  })
  .passthrough();

const eventScheduleItemSchema = z
  .object({
    start: optionalStringSchema,
    end: optionalStringSchema,
    title: z.string().trim().min(1, "Schedule item title is required"),
    speaker: optionalStringSchema,
    note: optionalStringSchema,
  })
  .passthrough();

const eventSchema = z
  .object({
    id: safeIdentifierSchema,
    type: z.enum([
      "congress",
      "summit",
      "meetup",
      "collab",
      "rave",
      "hackathon",
      "privacycorner",
      "online",
    ]),
    date: z.string().trim().min(1, "Event date is required"),
    city: z.string(),
    country: z.string(),
    title: optionalStringSchema,
    description: optionalStringSchema,
    place: optionalStringSchema,
    "place-address": optionalStringSchema,
    confirmed: optionalBooleanSchema,
    coincidence: optionalStringSchema,
    status: z.enum(["confirmed", "past", "upcoming", "registration", "draft", "cancelled"]).nullish().transform(undefineNull),
    lead: z.string(),
    links: eventLinksSchema,
    speakers: z.array(z.union([z.string(), eventSpeakerRefSchema])).nullish().transform(undefineNull),
    "speakers-source": z
      .union([
        z
          .object({
            kind: optionalStringSchema,
            url: optionalStringSchema,
          })
          .passthrough(),
        z.string(),
      ])
      .nullish()
      .transform(undefineNull),
    "speakers-count": optionalNumberSchema,
    hosts: z.array(eventHostSchema).nullish().transform(undefineNull),
    helpers: z.array(z.string()).nullish().transform(undefineNull),
    optional: optionalBooleanSchema,
    days: optionalNumberSchema,
    design: eventDesignSchema,
    premium: optionalBooleanSchema,
    attendees: z.array(eventAttendeeSchema).nullish().transform(undefineNull),
    themes: z.array(z.string()).nullish().transform(undefineNull),
    "program-outline": z.array(eventProgramItemSchema).nullish().transform(undefineNull),
    schedule: z.array(eventScheduleItemSchema).nullish().transform(undefineNull),
    "schedule-note": optionalStringSchema,
  })
  .passthrough();

const eventDetailLinkSchema = z
  .object({
    label: z.string().trim().min(1, "Link label is required"),
    url: z.string().trim().min(1, "Link URL is required"),
  })
  .passthrough();

const eventDetailSpeakerSchema = z
  .object({
    id: safeIdentifierSchema,
    name: z.string().trim().min(1, "Speaker name is required"),
    role: optionalStringSchema,
    avatar: optionalStringSchema,
    bio: optionalStringSchema,
    twitter: optionalStringSchema,
  })
  .passthrough();

const eventDetailExperienceCardSchema = z
  .object({
    icon: z.string().trim().min(1, "Experience icon is required"),
    title: z.string().trim().min(1, "Experience title is required"),
    description: z.string(),
  })
  .passthrough();

const eventDetailStageSchema = z
  .object({
    id: safeIdentifierSchema,
    name: z.string().trim().min(1, "Stage name is required"),
    slots: z.array(
      z
        .object({
          time: z.string().trim().min(1, "Slot time is required"),
          title: z.string().trim().min(1, "Slot title is required"),
          speaker: optionalStringSchema,
          description: optionalStringSchema,
        })
        .passthrough()
    ),
  })
  .passthrough();

const eventDetailGalleryImageSchema = z
  .object({
    url: optionalStringSchema,
    thumbnailUrl: optionalStringSchema,
    previewUrl: optionalStringSchema,
    fullSizeUrl: optionalStringSchema,
    caption: optionalStringSchema,
  })
  .passthrough()
  .refine(
    (value) => Boolean(value.url || value.thumbnailUrl || value.previewUrl || value.fullSizeUrl),
    "Gallery image must include at least one image URL"
  );

const eventDetailTicketTierSchema = z
  .object({
    name: z.string().trim().min(1, "Ticket tier name is required"),
    price: optionalStringSchema,
    soldOut: optionalBooleanSchema,
  })
  .passthrough();

const eventDetailFaqItemSchema = z
  .object({
    question: z.string().trim().min(1, "FAQ question is required"),
    answer: z.string(),
  })
  .passthrough();

const eventDetailSponsorSchema = z
  .object({
    name: z.string().trim().min(1, "Sponsor name is required"),
    twitter: optionalStringSchema,
    logo: optionalStringSchema,
    logoOnDark: optionalBooleanSchema,
    url: optionalStringSchema,
    tier: z.enum(["gold", "silver", "bronze"]).nullish().transform(undefineNull),
  })
  .passthrough();

const eventDetailContributorSchema = z
  .object({
    name: z.string().trim().min(1, "Contributor name is required"),
    avatar: optionalStringSchema,
    role: optionalStringSchema,
    handle: optionalStringSchema,
  })
  .passthrough();

const eventDetailSchema = z
  .object({
    eventId: safeIdentifierSchema,
    headerImageUrl: optionalStringSchema,
    heroBackgroundImageUrl: optionalStringSchema,
    timeRange: optionalStringSchema,
    addToCalendarUrl: optionalStringSchema,
    agendaUrl: optionalStringSchema,
    shortDescription: optionalStringSchema,
    highlights: z.array(z.string()).nullish().transform(undefineNull),
    stats: z
      .array(
        z
          .object({
            value: z.string(),
            label: z.string(),
          })
          .passthrough()
      )
      .nullish()
      .transform(undefineNull),
    topics: z
      .object({
        enabled: z.boolean(),
        content: z.string(),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    links: z
      .object({
        twitter: optionalStringSchema,
        discord: optionalStringSchema,
        telegram: optionalStringSchema,
        youtube: optionalStringSchema,
        custom: z.array(eventDetailLinkSchema).nullish().transform(undefineNull),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    experience: z
      .object({
        enabled: z.boolean(),
        title: optionalStringSchema,
        content: optionalStringSchema,
        cards: z.array(eventDetailExperienceCardSchema).nullish().transform(undefineNull),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    location: z
      .object({
        mapUrl: optionalStringSchema,
        directions: optionalStringSchema,
        name: optionalStringSchema,
        address: optionalStringSchema,
        city: optionalStringSchema,
        country: optionalStringSchema,
        website: optionalStringSchema,
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    eventMap: z
      .object({
        enabled: z.boolean(),
        imageUrl: z.string().trim().min(1, "Event map image is required"),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    schedule: z
      .object({
        enabled: z.boolean(),
        stages: z.array(eventDetailStageSchema).nullish().transform(undefineNull),
        items: z
          .array(
            z
              .object({
                date: optionalStringSchema,
                time: z.string().trim().min(1, "Schedule time is required"),
                title: z.string().trim().min(1, "Schedule title is required"),
                stage: optionalStringSchema,
                speaker: optionalStringSchema,
                description: optionalStringSchema,
              })
              .passthrough()
          )
          .nullish()
          .transform(undefineNull),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    gallery: z
      .object({
        enabled: z.boolean(),
        images: z.array(eventDetailGalleryImageSchema),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    tickets: z
      .object({
        enabled: z.boolean(),
        buyUrl: optionalStringSchema,
        guestCardImageUrl: optionalStringSchema,
        speakerContactUrl: optionalStringSchema,
        afterpartyUrl: optionalStringSchema,
        tiers: z.array(eventDetailTicketTierSchema).nullish().transform(undefineNull),
        saleEndsAt: optionalStringSchema,
        totalTickets: optionalNumberSchema,
        ticketsSold: optionalNumberSchema,
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    videos: z
      .object({
        enabled: z.boolean(),
        source: z.enum(["academy", "manual"]),
        talkIds: z.array(z.string()).nullish().transform(undefineNull),
        youtubeIds: z.array(z.string()).nullish().transform(undefineNull),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    articles: z
      .object({
        enabled: z.boolean(),
        articleIds: z.array(z.string()),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    faq: z
      .object({
        enabled: z.boolean(),
        items: z.array(eventDetailFaqItemSchema),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    sponsors: z
      .object({
        enabled: z.boolean(),
        becomeSponsorEmail: optionalStringSchema,
        items: z.array(eventDetailSponsorSchema),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    contributors: z
      .object({
        enabled: z.boolean(),
        items: z.array(eventDetailContributorSchema),
      })
      .passthrough()
      .nullish()
      .transform(undefineNull),
    speakers: z.array(eventDetailSpeakerSchema).nullish().transform(undefineNull),
    sections: z.record(z.boolean()).nullish().transform(undefineNull),
  })
  .passthrough();

const projectIndexItemSchema = z
  .object({
    id: safeIdentifierSchema,
    name: z.string().trim().min(1, "Project name is required"),
    description: optionalStringSchema,
    category: optionalStringSchema,
    order: optionalNumberSchema,
    hidden: optionalBooleanSchema,
    image: optionalStringSchema,
    icon: optionalStringSchema,
    links: z.record(z.unknown()).nullish().transform(undefineNull),
  })
  .passthrough();

function pathToString(path: string[]): string {
  return path.length ? path.join(".") : "body";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function shouldValidateAsUrl(path: string[]): boolean {
  const key = path[path.length - 1];
  const parent = path[path.length - 2];
  if (!key) return false;
  if (parent === "links") return true;
  return URLISH_KEYS.has(key) || URLISH_KEY_PATTERN.test(key);
}

function validateUrlLikeString(value: string, path: string[]): void {
  const normalized = value.trim();
  if (!normalized) return;
  if (path[path.length - 1] === "actionUrl") {
    if (!isAllowedNewsletterActionUrl(normalized)) {
      throw new AdminValidationError(
        "newsletter.actionUrl must use https:// and an allowed host from NEXT_PUBLIC_ALLOWED_NEWSLETTER_ACTION_HOSTS"
      );
    }
    return;
  }
  const lower = normalized.toLowerCase();
  if (normalized.startsWith("/")) return;
  if (normalized.startsWith("#")) return;
  if (normalized.startsWith("?")) return;
  if (normalized.startsWith("./") || normalized.startsWith("../") || normalized.startsWith("//")) {
    throw new AdminValidationError(`Unsafe URL value at ${pathToString(path)}`);
  }
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return;
  if (!SCHEME_PREFIX.test(normalized)) {
    throw new AdminValidationError(`URL-like field ${pathToString(path)} must use https://, http://, /path, #anchor, mailto:, or tel:`);
  }
  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      throw new AdminValidationError(`Unsupported URL protocol at ${pathToString(path)}`);
    }
  } catch (error) {
    if (error instanceof AdminValidationError) throw error;
    throw new AdminValidationError(`Invalid URL at ${pathToString(path)}`);
  }
}

export function assertSafeAdminContent(value: unknown, path: string[] = []): void {
  if (value == null) return;

  if (typeof value === "string") {
    if (DANGEROUS_PROTOCOL.test(value)) {
      throw new AdminValidationError(`Unsafe string value at ${pathToString(path)}`);
    }
    if (shouldValidateAsUrl(path)) {
      validateUrlLikeString(value, path);
    }
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeAdminContent(item, [...path, String(index)]));
    return;
  }

  if (!isPlainObject(value)) {
    throw new AdminValidationError(`Only plain JSON objects are allowed at ${pathToString(path)}`);
  }

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      throw new AdminValidationError(`Forbidden object key at ${pathToString([...path, key])}`);
    }
    assertSafeAdminContent(nested, [...path, key]);
  }
}

function getValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request payload";
  return issue.message;
}

export function parseAdminIdentifier(value: unknown, label = "Identifier"): string {
  try {
    return safeIdentifierSchema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(`${label}: ${getValidationMessage(error)}`);
    }
    throw error;
  }
}

export function parseDefaultContentMerge(body: unknown): Record<string, unknown> {
  let parsed: { merge: Record<string, unknown> };
  try {
    parsed = z.object({ merge: z.record(z.unknown()) }).strict().parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(getValidationMessage(error));
    }
    throw error;
  }

  const existingKeys = new Set(Object.keys(readDefaultContentFile().defaultContent));
  for (const key of Object.keys(parsed.merge)) {
    if (!existingKeys.has(key)) {
      throw new AdminValidationError(`Unknown default content section: ${key}`);
    }
    assertSafeAdminContent(parsed.merge[key], ["merge", key]);
  }
  return parsed.merge;
}

export function parseResourcesBody(body: unknown): Record<string, unknown> {
  let parsed: { resources: Record<string, unknown> };
  try {
    parsed = z.object({ resources: z.record(z.unknown()) }).strict().parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(getValidationMessage(error));
    }
    throw error;
  }
  assertSafeAdminContent(parsed.resources, ["resources"]);
  return parsed.resources;
}

export function parseProjectsIndexBody(body: unknown): Array<Record<string, unknown>> {
  const candidate =
    isPlainObject(body) && Array.isArray(body.projects)
      ? body.projects
      : body;

  let parsed: Array<Record<string, unknown>>;
  try {
    parsed = z.array(projectIndexItemSchema).parse(candidate) as Array<Record<string, unknown>>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(getValidationMessage(error));
    }
    throw error;
  }

  parsed.forEach((project, index) => assertSafeAdminContent(project, ["projects", String(index)]));
  return parsed;
}

export function parseProjectDetailBody(body: unknown): Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw new AdminValidationError("Project detail body must be a plain object");
  }
  assertSafeAdminContent(body, ["projectDetail"]);
  return body;
}

export function parseEventBody(body: Record<string, unknown>, mode: "create" | "update"): Event {
  const today = new Date().toISOString().split("T")[0];
  const id = parseAdminIdentifier(body.id ?? (mode === "create" ? `e${Date.now()}` : ""), "Event id");
  const normalized: Event = {
    ...(body as unknown as Event),
    id,
    type: (body.type as Event["type"] | undefined) ?? "meetup",
    date: typeof body.date === "string" && body.date.trim() ? body.date : today,
    city: typeof body.city === "string" ? body.city : "",
    country: typeof body.country === "string" ? body.country : "",
    lead: typeof body.lead === "string" ? body.lead : "",
    "place-address":
      (body["place-address"] as string | undefined) ??
      (body.placeAddress as string | undefined),
  };

  let parsed: Event;
  try {
    parsed = eventSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(getValidationMessage(error));
    }
    throw error;
  }
  assertSafeAdminContent(parsed, ["event"]);
  return parsed;
}

export function parseEventDetailBody(eventId: string, body: unknown, existing?: EventDetail | null): EventDetail {
  if (!isPlainObject(body)) {
    throw new AdminValidationError("Event detail body must be a plain object");
  }
  const safeEventId = parseAdminIdentifier(eventId, "Event id");
  let parsed: EventDetail;
  try {
    parsed = eventDetailSchema.parse({
      ...(existing ?? { eventId: safeEventId }),
      ...body,
      eventId: safeEventId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AdminValidationError(getValidationMessage(error));
    }
    throw error;
  }
  assertSafeAdminContent(parsed, ["eventDetail"]);
  return parsed;
}

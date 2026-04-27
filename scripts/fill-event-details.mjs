#!/usr/bin/env node
/**
 * Fill event detail YAML files for all events in index.yaml.
 * Uses placeholder data so every event has a full detail page.
 * Run: node scripts/fill-event-details.mjs
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "..");
const EVENTS_INDEX = path.join(WEB_ROOT, "data", "events", "index.yaml");
const DETAILS_DIR = path.join(WEB_ROOT, "data", "events", "details");

// Generic image URLs – use picsum for placeholders
const PLACEHOLDER_AVATAR = (i) => `https://i.pravatar.cc/120?img=${(i % 70) + 1}`;
const PLACEHOLDER_GALLERY = (i) => `https://picsum.photos/400/300?random=event-${i}`;
const EVENT_MAP_IMG = "/images/org/assets/events/event-map-test.webp";
const MEMBER_LOGOS = [
  "/images/home/sections/members/assets/members/dyne.webp",
  "/images/home/sections/members/assets/members/nomos.webp",
  "/images/home/sections/members/assets/members/logos.webp",
  "/images/home/sections/members/assets/members/codex.webp",
  "/images/home/sections/members/assets/members/labyrinth.webp",
  "/images/home/sections/members/assets/members/waku.webp",
];

function createEventDetail(eventId, event) {
  const city = event.city || "City";
  const country = event.country || "";
  const place = typeof event.place === "string" ? event.place.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim() : "TBA";
  const rsvpUrl = event.links?.rsvp || event.links?.web || "https://web3privacy.info";
  const webUrl = event.links?.web || event.links?.rsvp || "https://web3privacy.info";

  return {
    timeRange: "18:00 - 21:00",
    stats: [
      { value: "150+", label: "EVENT VISITORS" },
      { value: "8", label: "SPEAKERS" },
      { value: "100", label: "REGISTRATIONS" },
    ],
    agendaUrl: "#schedule",
    topics: {
      enabled: true,
      content: `Join us for a privacy-focused event in ${city}. We bring together developers, researchers, and advocates to explore the latest in Web3 privacy technology. Topics include zero-knowledge proofs, confidential transactions, and decentralized identity.`,
    },
    links: {
      custom: [
        { label: "RSVP / Register", url: rsvpUrl },
        { label: "Event Website", url: webUrl },
        { label: "Twitter", url: "https://twitter.com/web3privacy" },
        { label: "Telegram", url: "https://t.me/web3privacy" },
      ],
    },
    speakers: [
      { id: "1", name: "Mykola S.", role: "Co-Founder", avatar: PLACEHOLDER_AVATAR(1), bio: "Privacy & Web3 advocate." },
      { id: "2", name: "PG", role: "COO", avatar: PLACEHOLDER_AVATAR(2), bio: "Community & operations." },
      { id: "3", name: "Robert M.", role: "Researcher", avatar: PLACEHOLDER_AVATAR(3), bio: "ZK and cryptography." },
      { id: "4", name: "Anna K.", role: "Developer Advocate", avatar: PLACEHOLDER_AVATAR(4), bio: "Privacy tooling and SDKs." },
    ],
    experience: {
      enabled: true,
      cards: [
        { icon: "users", title: "Networking", description: "Connect with privacy advocates and builders from the ecosystem." },
        { icon: "talks", title: "Talks & Panels", description: "Expert discussions on the latest privacy technology." },
        { icon: "coffee", title: "Community", description: "Informal discussions and networking over drinks." },
      ],
    },
    location: {
      name: place !== "TBA" ? place : `${city} Venue`,
      address: event["place-address"] || "TBA",
      city,
      country: country.toUpperCase(),
      mapUrl: place !== "TBA" ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place + " " + city)}` : undefined,
    },
    eventMap: {
      enabled: true,
      imageUrl: EVENT_MAP_IMG,
    },
    schedule: {
      enabled: true,
      stages: [
        {
          id: "main",
          name: "Main Stage",
          slots: [
            { time: "18:00", title: "Doors open & registration", speaker: undefined, description: undefined },
            { time: "18:30", title: "Intro & Welcome", speaker: "Organizers", description: "Event overview and community updates." },
            { time: "19:00", title: "Privacy in Web3", speaker: "TBD", description: "Latest developments in privacy-preserving technology." },
            { time: "19:45", title: "Panel Discussion", speaker: "Speakers", description: "Open Q&A and community discussion." },
            { time: "20:30", title: "Networking & Drinks", speaker: undefined, description: "Informal networking." },
          ],
        },
      ],
    },
    gallery: {
      enabled: true,
      images: [
        { url: PLACEHOLDER_GALLERY(1), caption: "Venue" },
        { url: PLACEHOLDER_GALLERY(2), caption: "Talks" },
        { url: PLACEHOLDER_GALLERY(3), caption: "Networking" },
      ],
    },
    tickets: {
      enabled: true,
      buyUrl: rsvpUrl,
      speakerContactUrl: "mailto:info@web3privacy.info",
      afterpartyUrl: rsvpUrl,
      tiers: [{ name: "Guest", price: "Free", soldOut: false }],
    },
    faq: {
      enabled: true,
      items: [
        { question: "How do I register?", answer: "Click the RSVP link above to register via Luma. Registration is free." },
        { question: "Where is the venue?", answer: `The event takes place in ${city}. Exact address will be shared after registration.` },
        { question: "Will food and drinks be provided?", answer: "Yes, light refreshments and drinks are included." },
      ],
    },
    sponsors: {
      enabled: true,
      becomeSponsorEmail: "sponsors@web3privacy.info",
      items: MEMBER_LOGOS.slice(0, 4).map((logo, i) => ({
        name: ["Dyne", "Nomos", "Logos", "Codex"][i],
        logo,
        url: "https://web3privacy.info",
        twitter: "@web3privacy",
      })),
    },
    contributors: {
      enabled: true,
      items: [
        { name: "Alex", role: "Organizer", avatar: PLACEHOLDER_AVATAR(10) },
        { name: "Blanka", role: "Program", avatar: PLACEHOLDER_AVATAR(11) },
      ],
    },
  };
}

function main() {
  if (!fs.existsSync(EVENTS_INDEX)) {
    console.error("Events index file not found:", EVENTS_INDEX);
    process.exit(1);
  }

  const indexRaw = yaml.load(fs.readFileSync(EVENTS_INDEX, "utf8"));
  const events = Array.isArray(indexRaw) ? indexRaw : indexRaw?.events ?? [];

  if (!fs.existsSync(DETAILS_DIR)) {
    fs.mkdirSync(DETAILS_DIR, { recursive: true });
  }

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const id = event.id;
    if (!id) continue;
    const filePath = path.join(DETAILS_DIR, `${id}.yaml`);
    const existing = fs.existsSync(filePath) ? yaml.load(fs.readFileSync(filePath, "utf8")) : null;
    const baseDetail = existing && typeof existing === "object" ? existing : {};
    const fullDetail = { ...createEventDetail(id, event), ...baseDetail };
    const content = yaml.dump(fullDetail, { lineWidth: -1, noRefs: true });
    fs.writeFileSync(filePath, content, "utf8");
    if (existing) updated++;
    else created++;
  }

  console.log(
    `Event details: ${created} created, ${updated} updated, ${events.length} event(s) in index.`
  );
}

main();

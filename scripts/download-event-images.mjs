/**
 * Downloads event images from event websites (og:image from links.web or links.rsvp)
 * and saves them under public/images/events/items/{eventId}/header/{eventId}.webp.
 *
 * Usage (from app directory):
 *   node scripts/download-event-images.mjs
 *
 * Requires: js-yaml (project dependency), sharp. Uses Node fetch only.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, "..");
const EVENTS_YAML = path.join(APP_ROOT, "data", "events", "index.yaml");
const EVENTS_OUT_DIR = path.join(APP_ROOT, "public", "images", "events");

function eventHeaderPath(eventId) {
  return path.join(EVENTS_OUT_DIR, "items", eventId, "header", `${eventId}.webp`);
}

function legacyDesignPath(name) {
  return path.join(EVENTS_OUT_DIR, "legacy", `${name}.webp`);
}

function extractOgImage(html) {
  if (!html || typeof html !== "string") return null;
  const m1 = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (m1) return m1[1].trim();
  const m2 = html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (m2) return m2[1].trim();
  return null;
}

function resolveUrl(base, href) {
  if (href.startsWith("http")) return href;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; EventImageBot/1.0)" },
  });
  if (!res.ok) return null;
  return res.text();
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; EventImageBot/1.0)" },
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await sharp(buf, { limitInputPixels: false })
    .rotate()
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(destPath);
  return true;
}

async function main() {
  const yamlRaw = await fs.readFile(EVENTS_YAML, "utf8");
  const events = yaml.load(yamlRaw);
  if (!Array.isArray(events)) {
    console.error("Invalid events file: index.yaml must contain an array of events.");
    process.exit(1);
  }

  await fs.mkdir(EVENTS_OUT_DIR, { recursive: true });

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of events) {
    const id = event.id;
    if (!id) continue;

    const pageUrl = event.links?.web || event.links?.rsvp;

    const designName = event.design?.image;
    if (designName && !designName.startsWith("http") && !designName.startsWith("/")) {
      const designPath = legacyDesignPath(designName);
      let designExists = false;
      try {
        await fs.access(designPath);
        designExists = true;
      } catch {
        // continue
      }
      if (!designExists && pageUrl) {
        try {
          const html = await fetchHtml(pageUrl);
          const og = extractOgImage(html);
          const imageUrl = og ? resolveUrl(pageUrl, og) : null;
          if (imageUrl) {
            const ok = await downloadImage(imageUrl, designPath);
            if (ok) {
              console.log(`Downloaded legacy design image ${designName}.webp (event ${id}).`);
              done++;
            }
          }
        } catch {
          // non-fatal per event
        }
      }
    }

    if (!pageUrl) {
      console.log(`Skipped ${id}: no links.web or links.rsvp URL.`);
      skipped++;
      continue;
    }

    const destPath = eventHeaderPath(id);
    let exists = false;
    try {
      await fs.access(destPath);
      exists = true;
    } catch {
      // continue
    }
    if (exists) {
      console.log(`Skipped ${id}: image file already exists.`);
      done++;
      continue;
    }

    let html = null;
    try {
      html = await fetchHtml(pageUrl);
    } catch (e) {
      console.warn(`Failed ${id}: could not fetch page (${e?.message ?? "unknown error"}).`);
      failed++;
      continue;
    }

    let imageUrl = extractOgImage(html);
    if (!imageUrl) {
      console.log(`Skipped ${id}: no og:image meta tag on page.`);
      skipped++;
      continue;
    }

    imageUrl = resolveUrl(pageUrl, imageUrl);
    if (!imageUrl) {
      console.warn(`Failed ${id}: could not resolve image URL.`);
      failed++;
      continue;
    }

    try {
      const ok = await downloadImage(imageUrl, destPath);
      if (ok) {
        console.log(`Downloaded image for ${id}.`);
        done++;
      } else {
        console.warn(`Failed ${id}: image download returned non-OK response.`);
        failed++;
      }
    } catch (e) {
      console.warn(`Failed ${id}: ${e?.message ?? "download error"}.`);
      failed++;
    }
  }

  console.log(
    `\nFinished: ${done} completed, ${skipped} skipped, ${failed} failed.`
  );
}

main().catch((e) => {
  console.error("Script aborted:", e);
  process.exit(1);
});

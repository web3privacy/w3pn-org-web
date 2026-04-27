#!/usr/bin/env node
/**
 * One-shot: fetch Paragraph cover images into public/org/article-covers/
 * and patch project YAML + news markdown with thumbnail / imageUrl.
 *
 * Usage (from repo root): node scripts/fetch-paragraph-covers.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveParagraphCoverImageUrl,
  slugFromParagraphPublicationUrl,
  downloadImageToFile,
} from "./paragraph-cover-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(APP_ROOT, "public", "org", "article-covers");
const MANIFEST = path.join(APP_ROOT, "data", "org", "paragraph-cover-manifest.json");

const PARA_RE = /https:\/\/paragraph\.com\/@web3privacy-now\/[a-zA-Z0-9\-_%]+/g;

function collectUrlsFromFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const set = new Set();
  let m;
  while ((m = PARA_RE.exec(text)) !== null) {
    set.add(m[0]);
  }
  return [...set];
}

function collectAllUrls() {
  const urls = new Set();
  const dirs = [
    path.join(APP_ROOT, "data", "org", "projects", "details"),
    path.join(APP_ROOT, "data", "news", "articles"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".yaml") && !name.endsWith(".md")) continue;
      for (const u of collectUrlsFromFile(path.join(dir, name))) urls.add(u);
    }
  }
  return [...urls].sort();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitizeSlug(slug) {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "article";
}

async function main() {
  const urls = collectAllUrls();
  console.log(`Found ${urls.length} unique Paragraph URLs`);

  /** @type {Record<string, string>} publicationUrl -> web path /org/article-covers/... */
  const manifest = {};
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = sanitizeSlug(slugFromParagraphPublicationUrl(url));
    process.stdout.write(`[${i + 1}/${urls.length}] ${slug} ... `);
    try {
      const imageUrl = await resolveParagraphCoverImageUrl(url);
      if (!imageUrl) {
        console.log("no cover");
        errors.push({ url, error: "no cover in og:image" });
        await sleep(400);
        continue;
      }
      const destBase = path.join(OUT_DIR, slug);
      const abs = await downloadImageToFile(imageUrl, destBase);
      const webPath = "/" + path.relative(path.join(APP_ROOT, "public"), abs).split(path.sep).join("/");
      manifest[url] = webPath;
      console.log(webPath);
    } catch (e) {
      console.log("ERROR", e.message);
      errors.push({ url, error: String(e.message || e) });
    }
    await sleep(450);
  }

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify({ manifest, errors }, null, 2), "utf8");
  console.log(`\nWrote manifest: ${MANIFEST}`);

  // Patch YAML: after `href: <url>` insert `thumbnail: <path>` if missing
  const detailsDir = path.join(APP_ROOT, "data", "org", "projects", "details");
  for (const name of fs.readdirSync(detailsDir)) {
    if (!name.endsWith(".yaml")) continue;
    const fp = path.join(detailsDir, name);
    let text = fs.readFileSync(fp, "utf8");
    let changed = false;
    for (const [pubUrl, thumb] of Object.entries(manifest)) {
      const needle = `href: ${pubUrl}`;
      if (!text.includes(needle)) continue;
      if (text.includes(`${needle}\n    thumbnail:`) || text.includes(`${needle}\r\n    thumbnail:`)) continue;
      text = text.replace(needle, `${needle}\n    thumbnail: ${thumb}`);
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(fp, text, "utf8");
      console.log("Patched", name);
    }
  }

  // Patch news markdown: after `link: url` add imageUrl if missing
  const newsDir = path.join(APP_ROOT, "data", "news", "articles");
  if (fs.existsSync(newsDir)) {
    for (const name of fs.readdirSync(newsDir)) {
      if (!name.endsWith(".md")) continue;
      const fp = path.join(newsDir, name);
      let text = fs.readFileSync(fp, "utf8");
      let changed = false;
      for (const [pubUrl, thumb] of Object.entries(manifest)) {
        const needle = `link: ${pubUrl}`;
        if (!text.includes(needle)) continue;
        if (text.includes("imageUrl:")) continue;
        text = text.replace(needle, `${needle}\nimageUrl: ${thumb}`);
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fp, text, "utf8");
        console.log("Patched news", name);
      }
    }
  }

  if (errors.length) console.log("\nErrors count:", errors.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

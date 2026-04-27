#!/usr/bin/env node
/**
 * Fill project detail YAML files with placeholder data where sections are empty.
 * Ensures all project detail pages show full content.
 * Run: node scripts/fill-project-details.mjs
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "..");
const DETAILS_DIR = path.join(WEB_ROOT, "data", "org", "projects", "details");
const INDEX_FILE = path.join(WEB_ROOT, "data", "org", "projects", "index.yaml");

const PLACEHOLDER_AVATAR = (i) => `https://i.pravatar.cc/120?img=${(i % 70) + 1}`;

const PLACEHOLDER_ARTICLES = (projectName) => [
  { href: "https://web3privacy.info/news", title: `${projectName} – Latest Updates`, date: "2025", excerpt: "Curated privacy news and ecosystem updates.", thumbnail: "https://picsum.photos/400/200?random=art1" },
  { href: "https://web3privacy.info/news", title: "Privacy Ecosystem Report", date: "2024", excerpt: "Annual report on Web3 privacy trends and projects.", thumbnail: "https://picsum.photos/400/200?random=art2" },
];

const PLACEHOLDER_ROADMAP = (projectName) => [
  { quarter: "Q1 2026", title: "New features", description: `Expanding ${projectName} with community feedback.` },
  { quarter: "Q2 2026", title: "Integration", description: "Extended integrations and documentation." },
  { quarter: "Q3 2026", title: "Ecosystem growth", description: "Partnerships and community tools." },
];

const PLACEHOLDER_TESTIMONIALS = (projectName) => [
  { name: "Community Member", role: "Privacy Advocate", quote: `${projectName} is a valuable resource for the privacy community.`, avatar: PLACEHOLDER_AVATAR(5) },
  { name: "Developer", role: "Web3 Builder", quote: "Essential tool for privacy-focused development.", avatar: PLACEHOLDER_AVATAR(6) },
];

const PLACEHOLDER_TEAM = (projectName) => [
  { name: "Core Contributor", role: "Lead", avatar: PLACEHOLDER_AVATAR(7) },
  { name: "Community Lead", role: "Operations", avatar: PLACEHOLDER_AVATAR(8) },
];

const PLACEHOLDER_PARTNERS = () => [
  { name: "Web3 Privacy Now", logo: "/projects/portal.png", href: "https://web3privacy.info", description: "Community partner" },
  { name: "Ethereum Foundation", logo: "/projects/portal.png", href: "https://ethereum.org", description: "Ecosystem partner" },
];

function isEmptyArray(arr) {
  return Array.isArray(arr) && arr.length === 0;
}

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error("Projects index file not found:", INDEX_FILE);
    process.exit(1);
  }
  const indexRaw = yaml.load(fs.readFileSync(INDEX_FILE, "utf8"));
  const projects = Array.isArray(indexRaw) ? indexRaw : indexRaw?.projects ?? [];

  let updated = 0;
  for (const proj of projects) {
    const id = proj.id;
    if (!id) continue;
    const filePath = path.join(DETAILS_DIR, `${id}.yaml`);
    if (!fs.existsSync(filePath)) continue;

    const detail = yaml.load(fs.readFileSync(filePath, "utf8"));
    if (!detail || typeof detail !== "object") continue;

    const name = proj.name || id;
    let changed = false;

    if (isEmptyArray(detail.articles)) {
      detail.articles = PLACEHOLDER_ARTICLES(name);
      changed = true;
    }
    if (isEmptyArray(detail.roadmap)) {
      detail.roadmap = PLACEHOLDER_ROADMAP(name);
      changed = true;
    }
    if (isEmptyArray(detail.testimonials)) {
      detail.testimonials = PLACEHOLDER_TESTIMONIALS(name);
      changed = true;
    }
    if (isEmptyArray(detail.team)) {
      detail.team = PLACEHOLDER_TEAM(name);
      changed = true;
    }
    if (isEmptyArray(detail.partners)) {
      detail.partners = PLACEHOLDER_PARTNERS();
      changed = true;
    }
    if (!detail.feedback && typeof detail.feedback !== "object") {
      detail.feedback = { email: "web3privacynow@protonmail.com", subjectPrefix: `Feedback [${name}]` };
      changed = true;
    }
    if (!detail.screenshots || (Array.isArray(detail.screenshots) && detail.screenshots.length === 0)) {
      detail.screenshots = [
        { src: "https://picsum.photos/800/450?random=proj1", alt: "Screenshot", caption: "Project overview" },
        { src: "https://picsum.photos/800/450?random=proj2", alt: "Screenshot", caption: "Features" },
      ];
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, yaml.dump(detail, { lineWidth: -1, noRefs: true }), "utf8");
      updated++;
    }
  }
  console.log(`Project details: ${updated} file(s) updated.`);
}

main();

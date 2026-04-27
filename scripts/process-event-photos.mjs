import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const ROOT = process.cwd();
const EVENTS_INDEX = path.join(ROOT, "data", "events", "index.yaml");
const OUTPUT_DIR = path.join(ROOT, "processed-events");

const EVENT_TYPE_LABELS = {
  congress: "Congress",
  summit: "Summit",
  meetup: "Meetup",
  collab: "Collab",
  rave: "Rave",
  hackathon: "Hackathon",
  privacycorner: "Privacy Corner",
};

const EXPORTS = [
  {
    eventId: "c24bkk",
    sourceFolders: ["EVENT-PHOTOS/ECC"],
    files: [
      "EVENT-PHOTOS/ECC/FROM PPL/Screenshot from 2026-01-09 11-58-03.png",
      "EVENT-PHOTOS/ECC/FROM PPL/Screenshot from 2026-01-09 12-00-34.png",
      "EVENT-PHOTOS/ECC/FROM PPL/Screenshot from 2026-01-09 12-41-25.png",
      "EVENT-PHOTOS/ECC/FROM PPL/Screenshot from 2026-01-09 12-43-02.png",
      "EVENT-PHOTOS/ECC/FROM PPL/Screenshot from 2026-01-09 14-59-13.png",
      "EVENT-PHOTOS/ECC/W3PN/G48ehzfXQAA4wF8.jpeg",
      "EVENT-PHOTOS/ECC/W3PN/GcGmSeTb0AEdfzF.jpeg",
    ],
    notes: "Bangkok congress folder was stored under `ECC`; poster grids and slide graphics were excluded.",
  },
  {
    eventId: "c25bue",
    sourceFolders: ["EVENT-PHOTOS/ECC2"],
    files: [
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 11-56-51.png",
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 11-59-04.png",
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 11-59-39.png",
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 12-01-42.png",
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 12-02-17.png",
      "EVENT-PHOTOS/ECC2/FROM PPL/Screenshot from 2026-01-09 12-04-20.png",
      "EVENT-PHOTOS/ECC2/W3PN/G545fgZXQAAXVbR.jpeg",
      "EVENT-PHOTOS/ECC2/W3PN/G56RqdKXwAEhwAP.jpeg",
      "EVENT-PHOTOS/ECC2/W3PN/G59kfGnXUAAqZO7.jpeg",
      "EVENT-PHOTOS/ECC2/W3PN/G6TJU8FX0AAfCd-.jpeg",
      "EVENT-PHOTOS/ECC2/W3PN/G8TpnJfWsAIb7IT.jpeg",
    ],
    notes: "Buenos Aires congress folder was stored under `ECC2`; sponsor cards and poster graphics were excluded.",
  },
  {
    eventId: "m24rom",
    sourceFolders: ["EVENT-PHOTOS/Rome Meetup 2024"],
    files: [
      "EVENT-PHOTOS/Rome Meetup 2024/GZWjOs0WgAAPPv6.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/MEDIA/GYtrnoAXsAAUaob.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/MEDIA/GZdOgEjWsAACVlC.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/G3Y_L1-WcAESfpA.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/G3Y_L2AW8AAIA9y.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/G3Y_L6pX0AE-NJS.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/G3Y_MGIXMAA5_Gz.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/GZWjOs0WgAAPPv6.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/GZWjOsZXwAA1VS5.jpeg",
      "EVENT-PHOTOS/Rome Meetup 2024/W3PN/GZWjOtcXYAA9w5D.jpeg",
    ],
    notes: "Rome meetup folder contained mostly clean event photography, so all non-hidden image files were kept.",
  },
  {
    eventId: "m25tok",
    sourceFolders: ["EVENT-PHOTOS/ETHTokyo"],
    files: [
      "EVENT-PHOTOS/ETHTokyo/MEDIA/G0ZioX4XkAAhRsd.jpeg",
      "EVENT-PHOTOS/ETHTokyo/MEDIA/G0jfLRubEAACX0C.jpeg",
      "EVENT-PHOTOS/ETHTokyo/W3PN/G0jfLRWaMAA_YtQ.jpeg",
      "EVENT-PHOTOS/ETHTokyo/W3PN/G0jfLRtaEAA0IsD.jpeg",
      "EVENT-PHOTOS/ETHTokyo/W3PN/G0jfLRyawAEUH0V.jpeg",
      "EVENT-PHOTOS/ETHTokyo/W3PN/G0llnXhakAAPeki.jpeg",
    ],
    notes: "Only the direct photo files were exported; screenshots were skipped to keep the set clean.",
  },
  {
    eventId: "h25ber",
    sourceFolders: ["EVENT-PHOTOS/W3PN HACKS"],
    files: [
      "EVENT-PHOTOS/W3PN HACKS/FROM PPL/Screenshot from 2026-01-09 16-22-23.png",
      "EVENT-PHOTOS/W3PN HACKS/FROM PPL/Screenshot from 2026-01-09 16-22-51.png",
      "EVENT-PHOTOS/W3PN HACKS/FROM PPL/Screenshot from 2026-01-09 16-24-34.png",
    ],
    notes: "The source folder was dominated by posters and mentor cards; only photo-centric social captures were kept.",
  },
];

const REVIEW_ONLY = [
  {
    folder: "EVENT-PHOTOS/CYPHERPUNK RETREAT",
    reason:
      "Looks like a distinct Cypherpunk Retreat event that appears in org content, but it is not present as a current event entry in `data/events/index.yaml`.",
  },
  {
    folder: "EVENT-PHOTOS/ETHWarsaw",
    reason:
      "Contains ETHWarsaw side-event materials, but there is no matching Warsaw event in the current events YAML.",
  },
  {
    folder: "EVENT-PHOTOS/EPS",
    reason:
      "Represents Ethereum Privacy Stack / Devconnect Buenos Aires materials, but there is no standalone EPS entry in the current events YAML.",
  },
  {
    folder: "EVENT-PHOTOS/Privacy Hub Devconnect",
    reason:
      "Appears to be a separate Devconnect community hub activation, not a standalone event in the current events YAML.",
  },
  {
    folder: "EVENT-PHOTOS/Privacy Summit x Crecimiento",
    reason:
      "Appears to be a separate Buenos Aires collaboration event, not a standalone event in the current events YAML.",
  },
  {
    folder: "EVENT-PHOTOS/Memathon",
    reason:
      "Matches `h25mem`, but the folder is almost entirely memes and graphic assets rather than reusable event photos.",
  },
];

function loadEvents() {
  return yaml.load(fs.readFileSync(EVENTS_INDEX, "utf8"));
}

function getEventTitle(event) {
  if (event.title) return event.title;
  const type = EVENT_TYPE_LABELS[event.type] ?? event.type ?? "Event";
  const city = event.city ?? "";
  return `${type} ${city}`.trim();
}

function ensureCleanOutputDir() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function slugifyBaseName(filePath) {
  return path
    .basename(filePath, path.extname(filePath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function exportImage(sourcePath, destinationPath) {
  const image = sharp(sourcePath, { failOn: "none" }).rotate().resize({
    width: 1600,
    height: 1200,
    fit: "inside",
    withoutEnlargement: true,
  });

  const metadata = await image.metadata();
  const flattened = metadata.hasAlpha ? image.flatten({ background: "#ffffff" }) : image;

  await flattened.jpeg({ quality: 82, mozjpeg: true }).toFile(destinationPath);
}

function writeReport(processed, reviewOnly, missingFiles) {
  const lines = [];

  lines.push("# Processed Event Photos", "");
  lines.push("This folder was generated by `scripts/process-event-photos.mjs`.", "");
  lines.push("Folder naming assumption: subfolders use the YAML event `id`, because that is the stable unique identifier in `data/events/index.yaml`.", "");

  lines.push("## Processed", "");
  for (const item of processed) {
    lines.push(`- ${item.eventId} (${item.title})`);
    lines.push(`  Exported files: ${item.count}`);
    lines.push(`  Source folders: ${item.sourceFolders.join(", ")}`);
    lines.push(`  Notes: ${item.notes}`);
  }

  lines.push("", "## Needs Review", "");
  for (const item of reviewOnly) {
    lines.push(`- ${item.folder}`);
    lines.push(`  ${item.reason}`);
  }

  if (missingFiles.length > 0) {
    lines.push("", "## Missing During Run", "");
    for (const file of missingFiles) {
      lines.push(`- ${file}`);
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "REPORT.md"), lines.join("\n"), "utf8");
}

async function main() {
  const events = loadEvents();
  const byId = new Map(events.map((event) => [event.id, event]));
  const processed = [];
  const missingFiles = [];

  ensureCleanOutputDir();

  for (const plan of EXPORTS) {
    const event = byId.get(plan.eventId);
    if (!event) {
      throw new Error(`Event not found in YAML: ${plan.eventId}`);
    }

    const destinationDir = path.join(OUTPUT_DIR, plan.eventId);
    fs.mkdirSync(destinationDir, { recursive: true });

    let written = 0;
    for (const relativeSource of plan.files) {
      const sourcePath = path.join(ROOT, relativeSource);
      if (!fs.existsSync(sourcePath)) {
        missingFiles.push(relativeSource);
        continue;
      }

      const outputName = `${String(written + 1).padStart(2, "0")}-${slugifyBaseName(relativeSource)}.jpg`;
      const destinationPath = path.join(destinationDir, outputName);
      await exportImage(sourcePath, destinationPath);
      written += 1;
    }

    processed.push({
      eventId: plan.eventId,
      title: getEventTitle(event),
      sourceFolders: plan.sourceFolders,
      notes: plan.notes,
      count: written,
    });
  }

  writeReport(processed, REVIEW_ONLY, missingFiles);

  const summary = {
    processedEvents: processed.length,
    exportedImages: processed.reduce((sum, item) => sum + item.count, 0),
    reviewOnlyFolders: REVIEW_ONLY.length,
    missingFiles,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

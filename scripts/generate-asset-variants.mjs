import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DEFAULT_CONTENT_FILE = path.join(ROOT_DIR, "data", "org", "defaultContent.yaml");
const EVENT_DETAILS_DIR = path.join(ROOT_DIR, "data", "events", "details");
const PROJECT_DETAILS_DIR = path.join(ROOT_DIR, "data", "org", "projects", "details");

const APPLY = process.argv.includes("--apply");
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const RESOURCE_THUMB = { width: 480, height: 480 };
const RESOURCE_PREVIEW = { width: 1600, height: 1200 };
const EVENT_THUMB = { width: 900, height: 900 };
const EVENT_PREVIEW = { width: 1600, height: 1200 };
const PROJECT_THUMB = { width: 1200, height: 900 };
const PROJECT_PREVIEW = { width: 1600, height: 1200 };

function isLocalRasterUrl(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    RASTER_EXTENSIONS.has(path.extname(value).toLowerCase())
  );
}

function publicUrlToFilePath(url) {
  if (url.startsWith("/org/")) {
    return path.join(PUBLIC_DIR, url.slice(1));
  }
  if (url.startsWith("/assets/")) {
    return path.join(PUBLIC_DIR, "org", url.slice(1));
  }
  return path.join(PUBLIC_DIR, url.slice(1));
}

function variantUrl(originalUrl, suffix) {
  const parsed = path.posix.parse(originalUrl);
  return path.posix.join(parsed.dir, "__variants", `${parsed.name}--${suffix}.webp`);
}

async function ensureVariant(originalUrl, suffix, size) {
  const originalFile = publicUrlToFilePath(originalUrl);
  if (!fs.existsSync(originalFile)) {
    throw new Error(`Original image not found: ${originalUrl}`);
  }

  const variantPublicUrl = variantUrl(originalUrl, suffix);
  const variantFile = publicUrlToFilePath(variantPublicUrl);
  if (!APPLY) {
    return variantPublicUrl;
  }
  await fsp.mkdir(path.dirname(variantFile), { recursive: true });

  if (!fs.existsSync(variantFile)) {
    await sharp(originalFile, { limitInputPixels: false })
      .rotate()
      .resize({
        width: size.width,
        height: size.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        alphaQuality: 90,
        effort: 6,
      })
      .toFile(variantFile);
  }

  return variantPublicUrl;
}

function writeYaml(filePath, value) {
  fs.writeFileSync(filePath, yaml.dump(value, { lineWidth: -1, noRefs: true }), "utf8");
}

async function processResources() {
  const raw = yaml.load(fs.readFileSync(DEFAULT_CONTENT_FILE, "utf8"));
  const data = raw && typeof raw === "object" ? raw : {};
  const defaultContent =
    data && typeof data.defaultContent === "object" && data.defaultContent !== null ? data.defaultContent : {};
  const resources =
    defaultContent && typeof defaultContent.resources === "object" && defaultContent.resources !== null
      ? defaultContent.resources
      : null;

  if (!resources) {
    return { changed: false, generated: [] };
  }

  const generated = [];
  let changed = false;

  const visitAsset = async (asset) => {
    if (!asset || typeof asset !== "object") return;
    const originalCandidate = isLocalRasterUrl(asset.downloadUrl)
      ? asset.downloadUrl
      : isLocalRasterUrl(asset.thumbnailUrl)
        ? asset.thumbnailUrl
        : null;
    if (!originalCandidate) return;

    const thumb = await ensureVariant(originalCandidate, "thumb", RESOURCE_THUMB);
    const preview = await ensureVariant(originalCandidate, "preview", RESOURCE_PREVIEW);
    generated.push({ type: "resource", original: originalCandidate, thumb, preview });

    if (asset.thumbnailUrl !== thumb || asset.previewUrl !== preview || asset.downloadUrl !== originalCandidate) {
      asset.thumbnailUrl = thumb;
      asset.previewUrl = preview;
      asset.downloadUrl = originalCandidate;
      changed = true;
    }
  };

  const categories = Array.isArray(resources.categories) ? resources.categories : [];
  for (const category of categories) {
    if (Array.isArray(category.assets)) {
      for (const asset of category.assets) {
        await visitAsset(asset);
      }
    }
    if (Array.isArray(category.groups)) {
      for (const group of category.groups) {
        if (!Array.isArray(group.assets)) continue;
        for (const asset of group.assets) {
          await visitAsset(asset);
        }
      }
    }
  }

  if (APPLY && changed) {
    writeYaml(DEFAULT_CONTENT_FILE, data);
  }

  return { changed, generated };
}

async function processEventDetails() {
  const files = (await fsp.readdir(EVENT_DETAILS_DIR)).filter((name) => name.endsWith(".yaml"));
  const generated = [];
  let changedFiles = 0;

  for (const file of files) {
    const filePath = path.join(EVENT_DETAILS_DIR, file);
    const parsed = yaml.load(await fsp.readFile(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object") continue;
    const detail = parsed;
    const gallery = detail.gallery;
    if (!gallery || typeof gallery !== "object" || !Array.isArray(gallery.images)) continue;

    let changed = false;
    const nextImages = [];
    for (const item of gallery.images) {
      const entry =
        typeof item === "string"
          ? { url: item }
          : item && typeof item === "object"
            ? { ...item }
            : null;
      if (!entry) {
        nextImages.push(item);
        continue;
      }

      const original = [entry.fullSizeUrl, entry.previewUrl, entry.url, entry.thumbnailUrl].find(isLocalRasterUrl) ?? null;
      if (!original) {
        nextImages.push(entry);
        continue;
      }

      const thumb = await ensureVariant(original, "thumb", EVENT_THUMB);
      const preview = await ensureVariant(original, "preview", EVENT_PREVIEW);
      generated.push({ type: "event-gallery", original, thumb, preview });
      nextImages.push({
        thumbnailUrl: thumb,
        previewUrl: preview,
        fullSizeUrl: original,
        caption: entry.caption,
      });
      changed = true;
    }

    if (changed) {
      detail.gallery.images = nextImages;
      if (APPLY) {
        writeYaml(filePath, detail);
      }
      changedFiles += 1;
    }
  }

  return { changedFiles, generated };
}

async function processProjectDetails() {
  const files = (await fsp.readdir(PROJECT_DETAILS_DIR)).filter((name) => name.endsWith(".yaml"));
  const generated = [];
  let changedFiles = 0;

  for (const file of files) {
    const filePath = path.join(PROJECT_DETAILS_DIR, file);
    const parsed = yaml.load(await fsp.readFile(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.screenshots)) continue;

    let changed = false;
    parsed.screenshots = await Promise.all(
      parsed.screenshots.map(async (item) => {
        if (!item || typeof item !== "object") return item;
        const entry = { ...item };
        const original = [entry.src, entry.previewSrc, entry.thumbnailSrc].find(isLocalRasterUrl) ?? null;
        if (!original) return entry;

        const thumb = await ensureVariant(original, "thumb", PROJECT_THUMB);
        const preview = await ensureVariant(original, "preview", PROJECT_PREVIEW);
        generated.push({ type: "project-screenshot", original, thumb, preview });
        changed = true;
        return {
          ...entry,
          src: original,
          previewSrc: preview,
          thumbnailSrc: thumb,
        };
      })
    );

    if (changed) {
      if (APPLY) {
        writeYaml(filePath, parsed);
      }
      changedFiles += 1;
    }
  }

  return { changedFiles, generated };
}

async function main() {
  const [resources, events, projects] = await Promise.all([
    processResources(),
    processEventDetails(),
    processProjectDetails(),
  ]);

  const summary = {
    apply: APPLY,
    resourcesChanged: resources.changed,
    eventFilesChanged: events.changedFiles,
    projectFilesChanged: projects.changedFiles,
    generatedCount: resources.generated.length + events.generated.length + projects.generated.length,
    sample: [...resources.generated, ...events.generated, ...projects.generated].slice(0, 40),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

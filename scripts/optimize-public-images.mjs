import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const QUALITY = 82;
const APPLY = process.argv.includes("--apply");
const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const EXCLUDED_PREFIXES = [path.join(PUBLIC_DIR, "org", "assets", "resources")];
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isExcluded(filePath) {
  return EXCLUDED_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}${path.sep}`));
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (isExcluded(filePath)) continue;
    if (entry.isDirectory()) {
      await walk(filePath, out);
      continue;
    }
    if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(filePath);
    }
  }
  return out;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function encodeResizedImage(filePath, pipeline, format) {
  if (format === "jpeg" || format === "jpg") {
    return pipeline
      .jpeg({
        quality: QUALITY,
        mozjpeg: true,
        progressive: true,
      })
      .toFile(filePath);
  }

  if (format === "png") {
    return pipeline
      .png({
        compressionLevel: 9,
        effort: 9,
        adaptiveFiltering: true,
      })
      .toFile(filePath);
  }

  if (format === "webp") {
    return pipeline
      .webp({
        quality: QUALITY,
        effort: 6,
      })
      .toFile(filePath);
  }

  throw new Error(`Unsupported format for ${filePath}`);
}

async function optimizeFile(filePath) {
  const originalStats = await fs.stat(filePath);
  const input = sharp(filePath, { limitInputPixels: false }).rotate();
  const metadata = await input.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const format = metadata.format ?? path.extname(filePath).slice(1).toLowerCase();
  const hasMultiplePages = (metadata.pages ?? 1) > 1;

  if (hasMultiplePages || (width <= MAX_WIDTH && height <= MAX_HEIGHT)) {
    return null;
  }

  const tempFilePath = `${filePath}.tmp`;
  const resized = sharp(filePath, { limitInputPixels: false })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .withMetadata();

  await encodeResizedImage(tempFilePath, resized, format);

  const optimizedStats = await fs.stat(tempFilePath);
  await fs.chmod(tempFilePath, originalStats.mode);
  await fs.rename(tempFilePath, filePath);

  const optimizedMeta = await sharp(filePath).metadata();

  return {
    file: path.relative(ROOT_DIR, filePath),
    before: { bytes: originalStats.size, width, height },
    after: {
      bytes: optimizedStats.size,
      width: optimizedMeta.width ?? 0,
      height: optimizedMeta.height ?? 0,
    },
  };
}

async function collectOversizedFiles() {
  const files = await walk(PUBLIC_DIR);
  const oversized = [];

  for (const filePath of files) {
    const metadata = await sharp(filePath, { limitInputPixels: false }).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      oversized.push({
        file: path.relative(ROOT_DIR, filePath),
        width,
        height,
        bytes: (await fs.stat(filePath)).size,
      });
    }
  }

  oversized.sort((a, b) => b.bytes - a.bytes);
  return oversized;
}

async function main() {
  const oversized = await collectOversizedFiles();

  if (!APPLY) {
    const totalBytes = oversized.reduce((sum, item) => sum + item.bytes, 0);
    console.log(
      JSON.stringify(
        {
          apply: false,
          skippedPrefixes: EXCLUDED_PREFIXES.map((prefix) => path.relative(ROOT_DIR, prefix)),
          oversizedCount: oversized.length,
          oversizedBytes: totalBytes,
          maxWidth: MAX_WIDTH,
          maxHeight: MAX_HEIGHT,
          top: oversized.slice(0, 80),
        },
        null,
        2
      )
    );
    return;
  }

  const changed = [];
  for (const item of oversized) {
    const fullPath = path.join(ROOT_DIR, item.file);
    const result = await optimizeFile(fullPath);
    if (!result) continue;
    changed.push(result);
    const saved = result.before.bytes - result.after.bytes;
    console.log(
      `${result.file}: ${result.before.width}x${result.before.height} -> ${result.after.width}x${result.after.height} (${formatBytes(saved)} saved)`
    );
  }

  const totalBefore = changed.reduce((sum, item) => sum + item.before.bytes, 0);
  const totalAfter = changed.reduce((sum, item) => sum + item.after.bytes, 0);
  const totalSaved = totalBefore - totalAfter;

  console.log(
    JSON.stringify(
      {
        apply: true,
        changedCount: changed.length,
        totalBeforeBytes: totalBefore,
        totalAfterBytes: totalAfter,
        totalSavedBytes: totalSaved,
        totalSavedHuman: formatBytes(totalSaved),
        skippedPrefixes: EXCLUDED_PREFIXES.map((prefix) => path.relative(ROOT_DIR, prefix)),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

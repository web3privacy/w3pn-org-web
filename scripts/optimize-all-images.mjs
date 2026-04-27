import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const IMAGE_ROOT = path.join(ROOT_DIR, "all-images");
const MIN_BYTES = 100 * 1024;
const MIN_SAVINGS_BYTES = 8 * 1024;
const MIN_SAVINGS_RATIO = 0.05;
const REPORT_JSON_PATH = path.join(IMAGE_ROOT, "optimization-report.json");
const REPORT_MD_PATH = path.join(IMAGE_ROOT, "optimization-report.md");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const LANDSCAPE_BOX = { width: 1600, height: 1200 };
const PORTRAIT_BOX = { width: 1200, height: 1600 };
const SQUARE_BOX = { width: 1600, height: 1600 };

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }

    if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(fullPath);
    }
  }
  return out;
}

function getTargetBox(width, height) {
  if (width === 0 || height === 0) return LANDSCAPE_BOX;
  const ratio = width / height;
  if (ratio >= 0.85 && ratio <= 1.15) return SQUARE_BOX;
  return width >= height ? LANDSCAPE_BOX : PORTRAIT_BOX;
}

function needsResize(width, height) {
  const box = getTargetBox(width, height);
  return width > box.width || height > box.height;
}

function isEventLike(relativePath) {
  return (
    relativePath.includes("events/items/") ||
    relativePath.includes("events/shared/") ||
    relativePath.includes("site-shared/general-gallery/") ||
    relativePath.includes("about-us/sections/about/assets/gallery/")
  );
}

function isPhotoLike(relativePath, ext) {
  if (ext === "jpeg" || ext === "jpg" || ext === "webp" || ext === "avif") {
    return true;
  }

  const base = path.basename(relativePath).toLowerCase();
  return (
    relativePath.includes("/gallery/") ||
    relativePath.includes("/header/") ||
    base.startsWith("photo-") ||
    base.startsWith("selection-") ||
    base.includes("cover") ||
    base.includes("preview")
  );
}

function shouldTryPalette(relativePath, metadata) {
  const pixels = (metadata.width ?? 0) * (metadata.height ?? 0);
  return isPhotoLike(relativePath, "png") || pixels >= 900_000 || (metadata.hasAlpha ?? false);
}

function createBasePipeline(filePath, metadata) {
  let pipeline = sharp(filePath, { limitInputPixels: false, animated: false }).rotate();
  if (needsResize(metadata.width ?? 0, metadata.height ?? 0)) {
    const box = getTargetBox(metadata.width ?? 0, metadata.height ?? 0);
    pipeline = pipeline.resize({
      width: box.width,
      height: box.height,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return pipeline;
}

async function encodeCandidate(filePath, metadata, relativePath, strategy) {
  const isEvent = isEventLike(relativePath);
  const isPhoto = isPhotoLike(relativePath, metadata.format ?? "");
  const basePipeline = createBasePipeline(filePath, metadata);

  if (strategy === "jpeg") {
    return basePipeline
      .jpeg({
        quality: isEvent ? 74 : 80,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer({ resolveWithObject: true });
  }

  if (strategy === "png") {
    return basePipeline
      .png({
        compressionLevel: 9,
        effort: 10,
        adaptiveFiltering: true,
      })
      .toBuffer({ resolveWithObject: true });
  }

  if (strategy === "png-palette") {
    return basePipeline
      .png({
        compressionLevel: 9,
        effort: 10,
        adaptiveFiltering: true,
        palette: true,
        quality: isPhoto ? 80 : 88,
        colours: isPhoto ? 192 : 256,
        dither: isPhoto ? 0.7 : 1,
      })
      .toBuffer({ resolveWithObject: true });
  }

  if (strategy === "webp") {
    return basePipeline
      .webp({
        quality: isEvent ? 74 : 80,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer({ resolveWithObject: true });
  }

  if (strategy === "avif") {
    return basePipeline
      .avif({
        quality: isEvent ? 55 : 62,
        effort: 8,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer({ resolveWithObject: true });
  }

  throw new Error(`Unsupported strategy "${strategy}"`);
}

function getSameFormatStrategies(metadata, relativePath) {
  const format = (metadata.format ?? "").toLowerCase();
  if (format === "jpeg" || format === "jpg") return ["jpeg"];
  if (format === "webp") return ["webp"];
  if (format === "avif") return ["avif"];
  if (format === "png") {
    const strategies = ["png"];
    if (shouldTryPalette(relativePath, metadata)) strategies.push("png-palette");
    return strategies;
  }
  return [];
}

function shouldReplace(originalBytes, candidateBytes) {
  const savedBytes = originalBytes - candidateBytes;
  if (savedBytes < MIN_SAVINGS_BYTES) return false;
  return savedBytes / originalBytes >= MIN_SAVINGS_RATIO;
}

async function writeReplacement(filePath, data) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "all-images-opt-"));
  const tempPath = path.join(tempDir, path.basename(filePath));
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, filePath);
  await fs.rm(tempDir, { recursive: true, force: true });
}

async function analyzeFile(filePath) {
  const relativePath = path.relative(IMAGE_ROOT, filePath).split(path.sep).join("/");
  const originalStats = await fs.stat(filePath);
  const metadata = await sharp(filePath, { limitInputPixels: false, animated: false }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const format = (metadata.format ?? path.extname(filePath).slice(1)).toLowerCase();
  const pages = metadata.pages ?? 1;

  const entry = {
    file: relativePath,
    format,
    originalBytes: originalStats.size,
    originalHuman: formatBytes(originalStats.size),
    width,
    height,
    resized: needsResize(width, height),
    skipped: null,
    strategy: null,
    optimizedBytes: originalStats.size,
    optimizedHuman: formatBytes(originalStats.size),
    savedBytes: 0,
    savedHuman: formatBytes(0),
    savedRatio: 0,
    webpCandidateBytes: null,
    webpCandidateHuman: null,
    webpAdditionalBytes: 0,
    webpAdditionalHuman: formatBytes(0),
  };

  if (pages > 1) {
    entry.skipped = "multi-page";
    return entry;
  }

  if (originalStats.size < MIN_BYTES) {
    entry.skipped = "under-threshold";
    return entry;
  }

  const sameFormatStrategies = getSameFormatStrategies(metadata, relativePath);
  if (sameFormatStrategies.length === 0) {
    entry.skipped = "unsupported-format";
    return entry;
  }

  let bestCandidate = null;
  for (const strategy of sameFormatStrategies) {
    const candidate = await encodeCandidate(filePath, metadata, relativePath, strategy);
    if (!bestCandidate || candidate.data.length < bestCandidate.data.length) {
      bestCandidate = {
        strategy,
        bytes: candidate.data.length,
        data: candidate.data,
        info: candidate.info,
      };
    }
  }

  if (bestCandidate && shouldReplace(originalStats.size, bestCandidate.bytes)) {
    entry.strategy = bestCandidate.strategy;
    entry.optimizedBytes = bestCandidate.bytes;
    entry.optimizedHuman = formatBytes(bestCandidate.bytes);
    entry.savedBytes = originalStats.size - bestCandidate.bytes;
    entry.savedHuman = formatBytes(entry.savedBytes);
    entry.savedRatio = entry.savedBytes / originalStats.size;
    entry.optimizedWidth = bestCandidate.info.width ?? width;
    entry.optimizedHeight = bestCandidate.info.height ?? height;
    entry._data = bestCandidate.data;
  } else {
    entry.skipped = "not-worth-it";
    entry.optimizedWidth = width;
    entry.optimizedHeight = height;
  }

  if (format !== "webp") {
    const webpCandidate = await encodeCandidate(filePath, metadata, relativePath, "webp");
    const baselineBytes = entry.optimizedBytes;
    if (webpCandidate.data.length < baselineBytes) {
      entry.webpCandidateBytes = webpCandidate.data.length;
      entry.webpCandidateHuman = formatBytes(webpCandidate.data.length);
      entry.webpAdditionalBytes = baselineBytes - webpCandidate.data.length;
      entry.webpAdditionalHuman = formatBytes(entry.webpAdditionalBytes);
    }
  }

  return entry;
}

function buildSummary(entries) {
  const eligible = entries.filter((entry) => !entry.skipped || entry.skipped === "not-worth-it");
  const changed = entries.filter((entry) => entry.savedBytes > 0);
  const webpCandidates = entries.filter((entry) => entry.webpAdditionalBytes > 0);

  const byFormat = {};
  for (const entry of entries) {
    const bucket = (byFormat[entry.format] ??= {
      files: 0,
      originalBytes: 0,
      optimizedBytes: 0,
      savedBytes: 0,
    });
    bucket.files += 1;
    bucket.originalBytes += entry.originalBytes;
    bucket.optimizedBytes += entry.optimizedBytes;
    bucket.savedBytes += entry.savedBytes;
  }

  const totalOriginalBytes = entries.reduce((sum, entry) => sum + entry.originalBytes, 0);
  const totalOptimizedBytes = entries.reduce((sum, entry) => sum + entry.optimizedBytes, 0);
  const totalSavedBytes = totalOriginalBytes - totalOptimizedBytes;
  const totalWebpAdditionalBytes = webpCandidates.reduce((sum, entry) => sum + entry.webpAdditionalBytes, 0);

  return {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    imageRoot: path.relative(ROOT_DIR, IMAGE_ROOT),
    thresholds: {
      minBytes: MIN_BYTES,
      minSavingsBytes: MIN_SAVINGS_BYTES,
      minSavingsRatio: MIN_SAVINGS_RATIO,
      landscape: LANDSCAPE_BOX,
      portrait: PORTRAIT_BOX,
      square: SQUARE_BOX,
    },
    scannedCount: entries.length,
    eligibleCount: eligible.length,
    changedCount: changed.length,
    totalOriginalBytes,
    totalOriginalHuman: formatBytes(totalOriginalBytes),
    totalOptimizedBytes,
    totalOptimizedHuman: formatBytes(totalOptimizedBytes),
    totalSavedBytes,
    totalSavedHuman: formatBytes(totalSavedBytes),
    totalSavedRatio: totalOriginalBytes > 0 ? totalSavedBytes / totalOriginalBytes : 0,
    totalWebpAdditionalBytes,
    totalWebpAdditionalHuman: formatBytes(totalWebpAdditionalBytes),
    byFormat,
    topSavings: [...changed]
      .sort((a, b) => b.savedBytes - a.savedBytes)
      .slice(0, 40)
      .map((entry) => ({
        file: entry.file,
        strategy: entry.strategy,
        savedBytes: entry.savedBytes,
        savedHuman: entry.savedHuman,
        savedRatio: entry.savedRatio,
        originalBytes: entry.originalBytes,
        optimizedBytes: entry.optimizedBytes,
      })),
    topWebpCandidates: [...webpCandidates]
      .sort((a, b) => b.webpAdditionalBytes - a.webpAdditionalBytes)
      .slice(0, 40)
      .map((entry) => ({
        file: entry.file,
        currentBytes: entry.optimizedBytes,
        webpBytes: entry.webpCandidateBytes,
        additionalBytes: entry.webpAdditionalBytes,
        additionalHuman: entry.webpAdditionalHuman,
      })),
    files: entries.map((entry) => ({
      file: entry.file,
      format: entry.format,
      width: entry.width,
      height: entry.height,
      optimizedWidth: entry.optimizedWidth,
      optimizedHeight: entry.optimizedHeight,
      originalBytes: entry.originalBytes,
      optimizedBytes: entry.optimizedBytes,
      savedBytes: entry.savedBytes,
      savedRatio: entry.savedRatio,
      strategy: entry.strategy,
      skipped: entry.skipped,
      resized: entry.resized,
      webpCandidateBytes: entry.webpCandidateBytes,
      webpAdditionalBytes: entry.webpAdditionalBytes,
    })),
  };
}

function buildMarkdownReport(summary) {
  const lines = [];
  lines.push("# All Images Optimization Report", "");
  lines.push(`Generated: ${summary.generatedAt}`, "");
  lines.push("## Summary", "");
  lines.push(`- Mode: ${summary.apply ? "apply" : "dry-run"}`);
  lines.push(`- Scanned files: ${summary.scannedCount}`);
  lines.push(`- Eligible files over 100 KB: ${summary.eligibleCount}`);
  lines.push(`- Changed files: ${summary.changedCount}`);
  lines.push(`- Total before: ${summary.totalOriginalHuman}`);
  lines.push(`- Total after: ${summary.totalOptimizedHuman}`);
  lines.push(`- Saved: ${summary.totalSavedHuman} (${formatPercent(summary.totalSavedRatio)})`);
  lines.push(`- Additional WebP potential after this pass: ${summary.totalWebpAdditionalHuman}`);

  lines.push("", "## Top Savings", "");
  if (summary.topSavings.length === 0) {
    lines.push("- No files met the replacement threshold.");
  } else {
    for (const item of summary.topSavings.slice(0, 20)) {
      lines.push(
        `- ${item.file} -> ${item.strategy}, saved ${item.savedHuman} (${formatPercent(item.savedRatio)})`
      );
    }
  }

  lines.push("", "## Top WebP Candidates", "");
  if (summary.topWebpCandidates.length === 0) {
    lines.push("- No meaningful additional WebP savings detected in this pass.");
  } else {
    for (const item of summary.topWebpCandidates.slice(0, 20)) {
      lines.push(`- ${item.file} -> additional ${item.additionalHuman} if migrated to .webp`);
    }
  }

  lines.push("", "## Notes", "");
  lines.push("- This pass keeps the same folder structure and original file extensions.");
  lines.push("- WebP numbers are estimates for a possible second pass and were not applied automatically.");
  lines.push("- Replacement happens only when the optimized file is at least 8 KB and 5% smaller.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const files = await walk(IMAGE_ROOT);
  const entries = [];

  for (const filePath of files) {
    const entry = await analyzeFile(filePath);
    entries.push(entry);

    if (APPLY && entry.savedBytes > 0 && entry._data) {
      await writeReplacement(filePath, entry._data);
      console.log(
        `${entry.file}: ${entry.originalHuman} -> ${entry.optimizedHuman} (${entry.savedHuman} saved via ${entry.strategy})`
      );
    }
  }

  const summary = buildSummary(entries);
  await fs.writeFile(REPORT_JSON_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(REPORT_MD_PATH, buildMarkdownReport(summary), "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "all-images");
const TARGET_DIR = path.join(SOURCE_DIR, "iterace-1");
const RASTER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const TEXT_EXTENSIONS = new Set([".md", ".tsv", ".json", ".txt", ".yml", ".yaml"]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function replaceRasterExtension(relativePath) {
  const parsed = path.posix.parse(relativePath);
  return `${path.posix.join(parsed.dir, parsed.name)}.webp`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isEventLike(relativePath) {
  return (
    relativePath.includes("events/items/") ||
    relativePath.includes("events/shared/") ||
    relativePath.includes("site-shared/general-gallery/") ||
    relativePath.includes("about-us/sections/about/assets/gallery/")
  );
}

function isRaster(relativePath) {
  return RASTER_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "iterace-1") continue;
    if (entry.name === ".DS_Store") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function copyFile(sourcePath, targetPath) {
  await ensureDirForFile(targetPath);
  await fs.copyFile(sourcePath, targetPath);
}

async function convertToWebp(sourcePath, targetPath, relativePath) {
  const quality = isEventLike(relativePath) ? 74 : 80;
  await ensureDirForFile(targetPath);
  await sharp(sourcePath, { limitInputPixels: false, animated: false })
    .rotate()
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
      alphaQuality: 100,
    })
    .toFile(targetPath);
}

async function rewriteManifest(sourcePath, targetPath) {
  const text = await fs.readFile(sourcePath, "utf8");
  const lines = text.trimEnd().split(/\r?\n/);
  const rewritten = lines.map((line, index) => {
    if (index === 0) return line;
    const [exportPath, targetPathValue, owner] = line.split("\t");
    const nextExport = isRaster(exportPath) ? replaceRasterExtension(exportPath) : exportPath;
    const nextTarget = isRaster(targetPathValue) ? replaceRasterExtension(targetPathValue) : targetPathValue;
    return [nextExport, nextTarget, owner].join("\t");
  });
  await ensureDirForFile(targetPath);
  await fs.writeFile(targetPath, `${rewritten.join("\n")}\n`, "utf8");
}

function buildMarkdownReport(summary) {
  const lines = [];
  lines.push("# Iterace 1 WebP Report", "");
  lines.push(`Generated: ${summary.generatedAt}`, "");
  lines.push("## Summary", "");
  lines.push(`- Source folder: \`all-images\``);
  lines.push(`- Target folder: \`all-images/iterace-1\``);
  lines.push(`- Raster files converted/copied as WebP: ${summary.rasterFiles}`);
  lines.push(`- Non-raster files copied: ${summary.nonRasterFiles}`);
  lines.push(`- Current optimized raster size: ${summary.sourceRasterHuman}`);
  lines.push(`- Iterace-1 raster size: ${summary.targetRasterHuman}`);
  lines.push(`- Raster savings vs current optimized set: ${summary.rasterSavedHuman} (${summary.rasterSavedRatio})`);
  lines.push(`- Current total copied folder size baseline: ${summary.sourceTotalHuman}`);
  lines.push(`- Iterace-1 total size: ${summary.targetTotalHuman}`);
  lines.push(`- Total savings including docs/non-raster copies: ${summary.totalSavedHuman} (${summary.totalSavedRatio})`);
  lines.push("", "## What Changed", "");
  lines.push("- Every raster asset in this iteration now exists as `.webp`.");
  lines.push("- Directory hierarchy and basenames stay aligned with the original export, only raster extensions change.");
  lines.push("- `manifest.tsv` now points to future `.webp` targets, so app references cannot stay on `.png` / `.jpg` if this iteration is adopted.");
  lines.push("", "## App Work Needed", "");
  lines.push("- Update app references that currently expect `.png`, `.jpg` or `.jpeg` paths to the new `.webp` targets from `iterace-1/manifest.tsv`.");
  lines.push("- Re-run any asset ingestion/export step that depends on filename extension matching.");
  lines.push("- Smoke-test the build and image rendering after swapping targets back into `public/`.");
  lines.push("", "## Top Source Formats", "");
  for (const item of summary.sourceFormats) {
    lines.push(`- ${item.format}: ${item.count} files, ${item.bytesHuman}`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  await fs.rm(TARGET_DIR, { recursive: true, force: true });
  await fs.mkdir(TARGET_DIR, { recursive: true });

  const sourceFiles = await walk(SOURCE_DIR);
  let rasterFiles = 0;
  let nonRasterFiles = 0;
  let sourceRasterBytes = 0;
  let targetRasterBytes = 0;
  let copiedNonRasterBytes = 0;
  const sourceFormats = new Map();

  for (const sourcePath of sourceFiles) {
    const relativePath = toPosix(path.relative(SOURCE_DIR, sourcePath));
    const extension = path.extname(relativePath).toLowerCase();
    const sourceStats = await fs.stat(sourcePath);

    if (relativePath === "manifest.tsv") {
      await rewriteManifest(sourcePath, path.join(TARGET_DIR, relativePath));
      nonRasterFiles += 1;
      copiedNonRasterBytes += sourceStats.size;
      continue;
    }

    if (RASTER_EXTENSIONS.has(extension)) {
      rasterFiles += 1;
      sourceRasterBytes += sourceStats.size;
      sourceFormats.set(extension.slice(1), {
        format: extension.slice(1),
        count: (sourceFormats.get(extension.slice(1))?.count ?? 0) + 1,
        bytes: (sourceFormats.get(extension.slice(1))?.bytes ?? 0) + sourceStats.size,
      });

      const targetRelative = extension === ".webp" ? relativePath : replaceRasterExtension(relativePath);
      const targetPath = path.join(TARGET_DIR, targetRelative);

      if (extension === ".webp") {
        await copyFile(sourcePath, targetPath);
      } else {
        await convertToWebp(sourcePath, targetPath, relativePath);
      }

      const targetStats = await fs.stat(targetPath);
      targetRasterBytes += targetStats.size;
      continue;
    }

    const targetPath = path.join(TARGET_DIR, relativePath);
    await copyFile(sourcePath, targetPath);
    nonRasterFiles += 1;
    copiedNonRasterBytes += sourceStats.size;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    rasterFiles,
    nonRasterFiles,
    sourceRasterBytes,
    sourceRasterHuman: formatBytes(sourceRasterBytes),
    targetRasterBytes,
    targetRasterHuman: formatBytes(targetRasterBytes),
    rasterSavedBytes: sourceRasterBytes - targetRasterBytes,
    rasterSavedHuman: formatBytes(sourceRasterBytes - targetRasterBytes),
    rasterSavedRatio:
      sourceRasterBytes > 0 ? `${(((sourceRasterBytes - targetRasterBytes) / sourceRasterBytes) * 100).toFixed(1)}%` : "0.0%",
    sourceTotalBytes: sourceRasterBytes + copiedNonRasterBytes,
    sourceTotalHuman: formatBytes(sourceRasterBytes + copiedNonRasterBytes),
    targetTotalBytes: targetRasterBytes + copiedNonRasterBytes,
    targetTotalHuman: formatBytes(targetRasterBytes + copiedNonRasterBytes),
    totalSavedBytes: sourceRasterBytes - targetRasterBytes,
    totalSavedHuman: formatBytes(sourceRasterBytes - targetRasterBytes),
    totalSavedRatio:
      sourceRasterBytes + copiedNonRasterBytes > 0
        ? `${((((sourceRasterBytes - targetRasterBytes) / (sourceRasterBytes + copiedNonRasterBytes)) * 100)).toFixed(1)}%`
        : "0.0%",
    sourceFormats: [...sourceFormats.values()]
      .sort((a, b) => b.bytes - a.bytes)
      .map((item) => ({ ...item, bytesHuman: formatBytes(item.bytes) })),
  };

  await fs.writeFile(path.join(TARGET_DIR, "optimization-report.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(TARGET_DIR, "optimization-report.md"), buildMarkdownReport(summary), "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

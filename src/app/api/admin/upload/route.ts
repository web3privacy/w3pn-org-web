import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { getAppPackageRoot } from "@/lib/app-package-root";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Map<string, string[]>([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/gif", [".gif"]],
  ["image/webp", [".webp"]],
]);

const FOLDER_PUBLIC_SUBPATH: Record<string, string> = {
  uploads: "images/admin-uploads",
  gallery: "images/about-us/sections/about/assets/gallery",
  hero: "images/site-shared/admin-uploads",
  projects: "images/projects/uploads",
  donate: "images/donate/uploads",
};

function sanitizeBasename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 120) || "file";
}

function detectImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 6) {
    const gifHeader = buf.subarray(0, 6).toString("ascii");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

async function validateImageFile(buf: Buffer, mime: string): Promise<void> {
  const detectedMime = detectImageMime(buf);
  if (detectedMime !== mime) {
    throw new Error("Uploaded file content does not match its MIME type.");
  }
  if (mime === "image/gif") return;

  const metadata = await sharp(buf).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Uploaded image could not be decoded safely.");
  }
}

export async function POST(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  if (IS_VERCEL_READONLY) {
    return NextResponse.json({ error: "Uploads disabled on this deployment." }, { status: 403 });
  }

  const requestUrl = new URL(request.url);
  const folder = requestUrl.searchParams.get("folder") ?? "uploads";
  const publicSub = FOLDER_PUBLIC_SUBPATH[folder];
  if (!publicSub) {
    return NextResponse.json(
      { error: "Invalid folder. Use: uploads | gallery | hero | projects | donate" },
      { status: 400 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const allowedExtensions = ALLOWED_MIME.get(mime);
  if (!allowedExtensions) {
    return NextResponse.json({ error: `Unsupported type: ${mime}` }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    await validateImageFile(buf, mime);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image upload." },
      { status: 400 }
    );
  }

  const ext = path.extname(sanitizeBasename(file.name)).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return NextResponse.json(
      { error: `File extension ${ext || "(missing)"} does not match ${mime}.` },
      { status: 400 }
    );
  }
  const stamp = Date.now();
  const base = sanitizeBasename(file.name.replace(/\.[^.]+$/, ""));
  const filename = `${stamp}-${base}${ext}`;
  const publicDir = path.join(getAppPackageRoot(), "public", publicSub);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const diskPath = path.join(publicDir, filename);
  fs.writeFileSync(diskPath, buf);

  const publicUrl = `/${publicSub}/${filename}`.replace(/\/{2,}/g, "/");
  let thumbnailUrl = publicUrl;
  let thumbnailPath = `${publicSub}/${filename}`;

  if (folder === "gallery") {
    try {
      const thumbFilename = `${stamp}-${base}-thumb.webp`;
      const thumbPath = path.join(publicDir, thumbFilename);
      const thumbBuf = await sharp(buf)
        .rotate()
        .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(thumbPath, thumbBuf);
      thumbnailUrl = `/${publicSub}/${thumbFilename}`.replace(/\/{2,}/g, "/");
      thumbnailPath = `${publicSub}/${thumbFilename}`;
    } catch {
      thumbnailUrl = publicUrl;
      thumbnailPath = `${publicSub}/${filename}`;
    }
  }

  await appendAdminAuditEntryFromRequest(request, {
    action: "content.upload",
    target: `${publicSub}/${filename}`,
    summary: `Uploaded ${mime} into ${folder}`,
    details: {
      folder,
      mime,
      filename,
      sizeBytes: file.size,
      thumbnailPath,
    },
  });

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    path: `${publicSub}/${filename}`,
    thumbnailUrl,
    thumbnailPath,
  });
}

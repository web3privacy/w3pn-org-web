import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getEventsList } from "@/lib/org/events-data";
import { getProjects } from "@/lib/org/w3pn-projects";
import { absoluteUrl, DEFAULT_SHARE_IMAGE } from "@/lib/site-config";
import { loadEventDetail } from "@/lib/event-details";
import { loadProjectDetailFromYaml } from "@/lib/org/project-details";

type DocsManifest = {
  files?: Record<string, string>;
};

const DOCS_MANIFEST_PATH = path.join(process.cwd(), "public", "org", "data", "docs", "manifest.json");

function readDocsManifest(): DocsManifest | null {
  try {
    return JSON.parse(fs.readFileSync(DOCS_MANIFEST_PATH, "utf8")) as DocsManifest;
  } catch {
    return null;
  }
}

function docsRoutes(): string[] {
  const manifest = readDocsManifest();
  const keys = Object.keys(manifest?.files ?? {});
  return keys
    .map((key) => (key === "index" ? "/docs" : `/docs/${key}`))
    .filter((route, index, arr) => arr.indexOf(route) === index);
}

function normalizeImagePath(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) return absoluteUrl(raw);
  return absoluteUrl(`/org/${raw.replace(/^\/+/, "")}`);
}

function resolveEventImage(eventId: string): string[] | undefined {
  const detail = loadEventDetail(eventId);
  const image = normalizeImagePath(detail?.headerImageUrl) ?? normalizeImagePath(detail?.heroBackgroundImageUrl);
  return image ? [image] : undefined;
}

function resolveProjectImages(projectId: string, icon?: string): string[] | undefined {
  const detail = loadProjectDetailFromYaml(projectId) as {
    hero?: { backgroundImage?: string; graphic?: string; logo?: string };
    screenshots?: Array<{ previewSrc?: string; src?: string }>;
  } | null;

  const heroImage = normalizeImagePath(detail?.hero?.backgroundImage);
  const screenshotImage = normalizeImagePath(detail?.screenshots?.[0]?.previewSrc ?? detail?.screenshots?.[0]?.src);
  const fallbackImage = normalizeImagePath(detail?.hero?.graphic ?? detail?.hero?.logo ?? icon);
  const images = [heroImage, screenshotImage, fallbackImage].filter(Boolean) as string[];
  return images.length > 0 ? Array.from(new Set(images)) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.8, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/events"), lastModified: now, changeFrequency: "weekly", priority: 0.9, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/projects"), lastModified: now, changeFrequency: "weekly", priority: 0.9, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/resources"), lastModified: now, changeFrequency: "monthly", priority: 0.8, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/donate"), lastModified: now, changeFrequency: "monthly", priority: 0.8, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
    { url: absoluteUrl("/privacy-portal"), lastModified: now, changeFrequency: "monthly", priority: 0.6, images: [absoluteUrl(DEFAULT_SHARE_IMAGE)] },
  ];

  const eventRoutes: MetadataRoute.Sitemap = getEventsList().map((event) => ({
    url: absoluteUrl(`/events/${event.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
    images: resolveEventImage(event.id),
  }));

  const projectRoutes: MetadataRoute.Sitemap = getProjects().map((project) => ({
    url: absoluteUrl(`/projects/${project.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
    images: resolveProjectImages(project.id, typeof project.icon === "string" ? project.icon : undefined),
  }));

  const docsSitemapRoutes: MetadataRoute.Sitemap = docsRoutes().map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: "monthly",
    priority: route === "/docs" ? 0.8 : 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...projectRoutes, ...docsSitemapRoutes];
}

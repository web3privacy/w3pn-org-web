import { getEventsList } from "@/lib/org/events-data";
import { loadEventDetail } from "@/lib/event-details";
import { loadProjectDetailFromYaml } from "@/lib/org/project-details";
import { getProjects } from "@/lib/org/w3pn-projects";
import { absoluteUrl, DEFAULT_SHARE_IMAGE } from "@/lib/site-config";

function normalizeImagePath(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) return absoluteUrl(raw);
  return absoluteUrl(`/org/${raw.replace(/^\/+/, "")}`);
}

function buildUrlEntry(loc: string, images: Array<string | undefined>) {
  const uniqueImages = Array.from(new Set(images.filter(Boolean) as string[]));
  if (uniqueImages.length === 0) return "";

  return [
    "<url>",
    `<loc>${loc}</loc>`,
    ...uniqueImages.map((image) => `<image:image><image:loc>${image}</image:loc></image:image>`),
    "</url>",
  ].join("");
}

export async function GET() {
  const defaultShareImage = absoluteUrl(DEFAULT_SHARE_IMAGE);
  const entries = [
    buildUrlEntry(absoluteUrl("/"), [defaultShareImage]),
    buildUrlEntry(absoluteUrl("/events"), [defaultShareImage]),
    buildUrlEntry(absoluteUrl("/projects"), [defaultShareImage]),
  ];

  for (const event of getEventsList()) {
    const detail = loadEventDetail(event.id);
    entries.push(
      buildUrlEntry(absoluteUrl(`/events/${event.id}`), [
        normalizeImagePath(detail?.headerImageUrl),
        normalizeImagePath(detail?.heroBackgroundImageUrl),
      ]),
    );
  }

  for (const project of getProjects()) {
    const detail = loadProjectDetailFromYaml(project.id) as {
      hero?: { backgroundImage?: string; graphic?: string; logo?: string };
      screenshots?: Array<{ previewSrc?: string; src?: string }>;
    } | null;

    entries.push(
      buildUrlEntry(absoluteUrl(`/projects/${project.id}`), [
        normalizeImagePath(detail?.hero?.backgroundImage),
        normalizeImagePath(detail?.screenshots?.[0]?.previewSrc ?? detail?.screenshots?.[0]?.src),
        normalizeImagePath(detail?.hero?.graphic ?? detail?.hero?.logo),
        normalizeImagePath(typeof project.icon === "string" ? project.icon : undefined),
      ]),
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.filter(Boolean),
    "</urlset>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

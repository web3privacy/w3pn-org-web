import fs from "node:fs/promises";
import path from "node:path";

import OrgDocsViewer from "@/components/org/docs/OrgDocsViewer";
import { buildMetadata } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const DOCS_DIR = path.join(process.cwd(), "public", "org", "data", "docs");
const RAW_GITHUB_DOCS_BASE =
  "https://raw.githubusercontent.com/web3privacy/docs/main/src/content/docs";

type DocsManifest = { files?: Record<string, string> } | null;
type SidebarBlock = { label: string; link?: string; items?: { label: string; link: string }[] };

function getSlugFromParam(slugParam: string[] | undefined): string {
  if (!slugParam || slugParam.length === 0) return "";
  return slugParam.join("/").replace(/\/$/, "");
}

function humanizeSlugPart(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = getSlugFromParam(slug);
  const title = slugValue ? `Docs: ${humanizeSlugPart(slugValue.split("/").at(-1) ?? slugValue)}` : "Docs";
  return buildMetadata({
    title,
    description: "Documentation and guides for the Web3Privacy ecosystem.",
    path: slugValue ? `/docs/${slugValue}` : "/docs",
  });
}

function resolveFilePath(slug: string, manifest: DocsManifest): string | null {
  if (!slug) return manifest?.files?.index ?? "index.mdx";
  const normalized = slug.toLowerCase();
  if (manifest?.files?.[normalized]) return manifest.files[normalized];
  if (slug.startsWith("portal-and-org-web")) return `${slug}.md`;
  return null;
}

function extractLastUpdated(rawMarkdown: string): string | null {
  const fmMatch = rawMarkdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const lastUpdatedMatch = fmMatch[1].match(/lastUpdated:\s*["']?([^"'\n]+)/);
  return lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readLocalDocFile(filePath: string): Promise<string> {
  return fs.readFile(path.join(DOCS_DIR, filePath), "utf8");
}

async function fetchRemoteDocFile(filePath: string): Promise<string> {
  const response = await fetch(`${RAW_GITHUB_DOCS_BASE}/${filePath}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status}`);
  }
  return response.text();
}

async function loadRemoteDoc(
  slug: string,
  resolvedPath: string | null
): Promise<{ rawMarkdown: string; filePath: string | null }> {
  const candidates = [
    resolvedPath,
    slug ? `${slug}.mdx` : "index.mdx",
    slug ? `${slug}.md` : "index.md",
    slug ? `${slug}/index.mdx` : null,
    slug ? `${slug}/index.md` : null,
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      const rawMarkdown = await fetchRemoteDocFile(candidate);
      return { rawMarkdown, filePath: candidate };
    } catch {
      continue;
    }
  }

  throw new Error("Remote page not found");
}

export default async function OrgDocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugValue = getSlugFromParam(slug);
  const sidebar =
    (await readJsonFile<SidebarBlock[]>(path.join(DOCS_DIR, "sidebar.json"))) ?? null;
  const manifest = await readJsonFile<DocsManifest>(path.join(DOCS_DIR, "manifest.json"));
  const resolvedPath = resolveFilePath(slugValue, manifest);
  const filePath = resolvedPath || (slugValue ? `${slugValue}.md` : "index.mdx");
  const isPortalDoc = slugValue.startsWith("portal-and-org-web");

  let rawMarkdown = "";
  let error: string | null = null;
  let servedFilePath: string | null = resolvedPath || filePath;

  try {
    if (isPortalDoc) {
      rawMarkdown = await readLocalDocFile(filePath);
    } else {
      const remoteDoc = await loadRemoteDoc(slugValue, resolvedPath);
      rawMarkdown = remoteDoc.rawMarkdown;
      servedFilePath = remoteDoc.filePath;
    }
  } catch {
    try {
      rawMarkdown = await readLocalDocFile(filePath);
      servedFilePath = filePath;
      error = "Showing local fallback copy because GitHub content could not be loaded.";
    } catch {
      error = "Page not found";
    }
  }

  return (
    <OrgDocsViewer
      slugParam={slug}
      initialSidebar={sidebar}
      initialManifest={manifest}
      initialRawMarkdown={rawMarkdown}
      initialFilePath={servedFilePath}
      initialLastUpdated={rawMarkdown ? extractLastUpdated(rawMarkdown) : null}
      initialError={error}
    />
  );
}

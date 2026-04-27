/**
 * News/articles data loader. Reads markdown articles from data/news/articles/,
 * parses frontmatter, applies overrides from index.yaml/news-user.yaml,
 * and provides CRUD helpers for the admin interface.
 *
 * On self-hosted VPS, canonical news data may live under W3PN_DATA_ROOT/news/.
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Article, NewsData } from "@/types/news";
import { loadYaml } from "@/lib/yaml-utils";
import { getArticleDisplayImageUrl } from "@/lib/org/article-preview";
import { getPackageDataPath, getReadableDataPath, getWritableDataPath } from "@/lib/runtime-paths";

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  let parsed: Record<string, unknown> = {};
  try {
    parsed = (yaml.load(match[1]) as Record<string, unknown>) ?? {};
  } catch {
    // ignore
  }
  return { data: parsed, content: match[2]?.trim() ?? "" };
}

const PACKAGE_NEWS_DIR = getPackageDataPath("news");
const PACKAGE_ARTICLES_DIR = path.join(PACKAGE_NEWS_DIR, "articles");
const WRITABLE_NEWS_DIR = getWritableDataPath("news");
const WRITABLE_ARTICLES_DIR = path.join(WRITABLE_NEWS_DIR, "articles");
const INDEX_FILE = getReadableDataPath("news", "index.yaml");
const USER_INDEX_FILE = getWritableDataPath("news", "news-user.yaml");

function getReadableArticlesDir(): string {
  return fs.existsSync(WRITABLE_ARTICLES_DIR) ? WRITABLE_ARTICLES_DIR : PACKAGE_ARTICLES_DIR;
}

function parseArticleFromMarkdown(filePath: string): Article | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data: fm, content } = parseFrontmatter(raw);
    const id = (fm.id as string) || path.basename(filePath, ".md");
    const link = (fm.link as string) || "";
    let imageUrl = (fm.imageUrl as string) || "";
    if (!link && !imageUrl) return null;
    let title = (fm.title as string) || id;
    let perex = (fm.perex as string) || "";
    if (title.includes("---") || title.length < 5) title = `Week in the Privacy News ${id}`;
    const metadataLike = /^---\s*curator|^---\s*paragraph|^curator:|^paragraph:|^published:|^exactDate:|^links:/i;
    if (metadataLike.test(perex) || perex.includes("--- curator")) {
      perex = "";
    }
    if (metadataLike.test(title) || title.includes("--- curator")) {
      title = `Week in the Privacy News ${id}`;
    }
    if (!perex && content) {
      const firstBlock = content.split(/\n---\n/)[0] || content;
      const text = firstBlock
        .replace(/!\[.*?\]\([^)]*\)/g, "")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      perex = text.slice(0, 200) + (text.length > 200 ? "..." : "");
    }
    if (imageUrl.includes("github.com") && imageUrl.includes("/blob/")) {
      imageUrl = imageUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }
    imageUrl = getArticleDisplayImageUrl({
      title,
      subtitle: perex,
      kind: "news",
      seed: id,
      explicitImage: imageUrl || undefined,
    });
    let author = (fm.author as string) || (fm.curator as string) || "";
    if (!author || author === "m" || author.length <= 1) {
      author = "Web3Privacy";
    }
    return {
      id,
      title,
      perex,
      imageUrl,
      link: link || `/news/${id}`,
      date: (fm.date as string) || (fm.exactDate as string) || "",
      author,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      isHighlighted: Boolean(fm.isHighlighted),
      type: (fm.type as Article["type"]) || "article",
      source: (fm.source as Article["source"]) || "newsletter",
      sourceFeedId: fm.sourceFeedId as string | undefined,
      hasDetail: Boolean(fm.hasDetail ?? fm.source === "newsletter"),
      published: fm.published === undefined ? true : Boolean(fm.published),
      content: content?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

function loadArticlesFromDir(): Article[] {
  const articlesDir = getReadableArticlesDir();
  if (!fs.existsSync(articlesDir)) return [];
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
  const articles: Article[] = [];
  for (const f of files) {
    const a = parseArticleFromMarkdown(path.join(articlesDir, f));
    if (a && a.date) articles.push(a);
  }
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export type FeedSourceForIndex = {
  id: string;
  type: "rss" | "url";
  url: string;
  enabled?: boolean;
};

type IndexSchema = {
  featuredProjectIds?: string[];
  articleOverrides?: Record<string, Partial<Article>>;
  donationTiers?: { amount: string; label: string; url?: string }[];
  feedSources?: FeedSourceForIndex[];
};

function mergeArticleWithOverrides(article: Article, overrides: Record<string, Partial<Article>>): Article {
  const o = overrides[article.id];
  if (!o) return article;
  return { ...article, ...o };
}

export function loadNewsData(): NewsData {
  const index = loadYaml<IndexSchema>(INDEX_FILE, {});
  const userIndex = loadYaml<IndexSchema>(USER_INDEX_FILE, {});
  const overrides = { ...index.articleOverrides, ...userIndex.articleOverrides };
  const articles = loadArticlesFromDir()
    .map((a) => mergeArticleWithOverrides(a, overrides))
    .filter((a) => a.published !== false);
  const featuredProjectIds = userIndex.featuredProjectIds ?? index.featuredProjectIds ?? [];
  const donationTiers = userIndex.donationTiers ?? index.donationTiers ?? [];
  return { articles, featuredProjectIds, donationTiers };
}

export function loadNewsDataForAdmin(): NewsData & { articles: Article[] } {
  const index = loadYaml<IndexSchema>(INDEX_FILE, {});
  const userIndex = loadYaml<IndexSchema>(USER_INDEX_FILE, {});
  const overrides = { ...index.articleOverrides, ...userIndex.articleOverrides };
  const articles = loadArticlesFromDir().map((a) => mergeArticleWithOverrides(a, overrides));
  const featuredProjectIds = userIndex.featuredProjectIds ?? index.featuredProjectIds ?? [];
  const donationTiers = userIndex.donationTiers ?? index.donationTiers ?? [];
  return { articles, featuredProjectIds, donationTiers };
}

export function getArticleById(id: string): Article | undefined {
  const data = loadNewsData();
  return data.articles.find((a) => a.id === id);
}

export function getArticleByIdForAdmin(id: string): Article | undefined {
  const data = loadNewsDataForAdmin();
  return data.articles.find((a) => a.id === id);
}

export function getNewsUserIndex(): IndexSchema {
  return loadYaml<IndexSchema>(USER_INDEX_FILE, {});
}

export function saveNewsUserIndex(data: IndexSchema): void {
  fs.mkdirSync(path.dirname(USER_INDEX_FILE), { recursive: true });
  fs.writeFileSync(
    USER_INDEX_FILE,
    yaml.dump(data, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false }),
    "utf8"
  );
}

function getReadableArticleMarkdownPath(id: string): string | null {
  const writable = path.join(WRITABLE_ARTICLES_DIR, `${id}.md`);
  if (fs.existsSync(writable)) return writable;
  const packaged = path.join(PACKAGE_ARTICLES_DIR, `${id}.md`);
  if (fs.existsSync(packaged)) return packaged;

  for (const dir of [WRITABLE_ARTICLES_DIR, PACKAGE_ARTICLES_DIR]) {
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const match = files.find((f) => f.endsWith(".md") && path.basename(f, ".md") === id);
    if (match) return path.join(dir, match);
  }
  return null;
}

function getWritableArticleMarkdownPath(id: string): string {
  return path.join(WRITABLE_ARTICLES_DIR, `${id}.md`);
}

export function updateArticleMarkdown(
  id: string,
  updates: Partial<Pick<Article, "title" | "perex" | "link" | "imageUrl" | "date" | "author" | "tags">> & { content?: string }
): boolean {
  const readablePath = getReadableArticleMarkdownPath(id);
  if (!readablePath) return false;
  const raw = fs.readFileSync(readablePath, "utf8");
  const { data: fm, content } = parseFrontmatter(raw);
  const { content: newContent, ...fmUpdates } = updates;
  const nextFm = { ...fm, ...fmUpdates };
  const frontYaml = yaml.dump(nextFm, { lineWidth: -1, noRefs: true });
  const writePath = getWritableArticleMarkdownPath(id);
  fs.mkdirSync(path.dirname(writePath), { recursive: true });
  if (newContent !== undefined) {
    fs.writeFileSync(writePath, `---\n${frontYaml}---\n\n${newContent}\n`, "utf8");
  } else {
    fs.writeFileSync(writePath, `---\n${frontYaml}---\n\n${content || ""}\n`, "utf8");
  }
  return true;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "article";
}

export function createArticleMarkdown(data: {
  id?: string;
  title: string;
  perex?: string;
  link?: string;
  imageUrl?: string;
  content?: string;
}): string | null {
  const dateStr = new Date().toISOString().slice(0, 10);
  const id =
    (data.id && data.id.trim()) ||
    `${dateStr}-${slugify(data.title).slice(0, 40)}`;
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, "-");
  if (getReadableArticleMarkdownPath(safeId)) return null;
  const filePath = getWritableArticleMarkdownPath(safeId);
  const frontmatter = {
    id: safeId,
    title: data.title.trim(),
    perex: (data.perex ?? "").trim(),
    link: (data.link ?? "").trim() || `/news/${safeId}`,
    imageUrl: (data.imageUrl ?? "").trim(),
    date: dateStr,
    author: "Web3Privacy",
    tags: [],
    isHighlighted: false,
    type: "article",
    source: "newsletter",
    hasDetail: true,
    published: true,
  };
  const frontYaml = yaml.dump(frontmatter, { lineWidth: -1, noRefs: true });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `---\n${frontYaml}---\n\n${(data.content ?? "").trim()}\n`, "utf8");
  return safeId;
}

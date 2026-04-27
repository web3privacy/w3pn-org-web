import { orgAsset } from "@/lib/org/asset-url";

export type ArticlePreviewKind = "article" | "news" | "project" | "event";

export type ArticlePreviewInput = {
  title: string;
  subtitle?: string;
  explicitImage?: string | null;
  kind?: ArticlePreviewKind;
  seed?: string;
};

export function buildArticlePreviewUrl(input: Omit<ArticlePreviewInput, "explicitImage">): string {
  const params = new URLSearchParams();
  params.set("title", input.title);
  if (input.subtitle) params.set("subtitle", input.subtitle);
  if (input.kind) params.set("kind", input.kind);
  if (input.seed) params.set("seed", input.seed);
  return `/api/org/article-preview?${params.toString()}`;
}

export function getArticleDisplayImageUrl(input: ArticlePreviewInput): string {
  const explicit = orgAsset(input.explicitImage);
  if (explicit) return explicit;
  return buildArticlePreviewUrl({
    title: input.title,
    subtitle: input.subtitle,
    kind: input.kind ?? "article",
    seed: input.seed,
  });
}

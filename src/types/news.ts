export type ArticleType = "article" | "podcast" | "video";
export type ArticleSource = "newsletter" | "rss" | "manual" | "external";

export interface Article {
  id: string;
  title: string;
  perex: string;
  imageUrl: string;
  link: string;
  date: string;
  author?: string;
  tags: string[];
  isHighlighted: boolean;
  type: ArticleType;
  source: ArticleSource;
  sourceFeedId?: string;
  /** If true, article has detail page at /news/[id]; if false, link opens in new tab */
  hasDetail: boolean;
  /** If false, article is hidden from feed (admin draft) */
  published?: boolean;
  /** Full markdown content for detail page (only when hasDetail) */
  content?: string;
}

export interface DonationTier {
  amount: string;
  label: string;
  url?: string;
}

export interface NewsData {
  articles: Article[];
  featuredProjectIds: string[];
  donationTiers?: DonationTier[];
}

export const ARTICLE_TAGS = [
  "insights",
  "knowledge",
  "inspiration-online",
  "inspiration-offline",
  "tool-of-week",
  "ai",
  "web3",
  "security",
  "events",
  "tools",
] as const;

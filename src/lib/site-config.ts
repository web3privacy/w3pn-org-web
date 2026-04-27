import type { Metadata } from "next";

export const SITE_NAME = "Web3Privacy Now";
export const SITE_DESCRIPTION = "Uniting efforts and empowering society to defend freedom.";
export const SITE_DEFAULT_LANGUAGE = "en";
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://web3privacy.info").replace(/\/+$/, "");
export const DEFAULT_SHARE_IMAGE = "/share/homepage-share.png";
export const DEFAULT_KEYWORDS = [
  "Web3 privacy",
  "digital freedom",
  "privacy events",
  "privacy education",
  "cypherpunk",
  "privacy ecosystem",
  "privacy tools",
  "Web3Privacy Now",
];

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
};

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  images = [DEFAULT_SHARE_IMAGE],
  type = "website",
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = absoluteUrl(path);
  const shareImages = images.map((image) => absoluteUrl(image));

  return {
    title: title ?? SITE_NAME,
    description,
    keywords: DEFAULT_KEYWORDS,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type,
      url: canonical,
      title: resolvedTitle,
      description,
      siteName: SITE_NAME,
      locale: "en_US",
      images: shareImages.map((url) => ({ url })),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: shareImages,
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    sameAs: [
      "https://x.com/web3privacy",
      "https://t.me/+QOj6126xlEs0OTQ0",
      "https://www.youtube.com/@Web3PrivacyNow",
      "https://bsky.app/profile/web3privacy.info",
      "https://github.com/web3privacy",
      "https://www.linkedin.com/company/web3privacynow",
      "https://www.instagram.com/web3privacy_now/",
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_DEFAULT_LANGUAGE,
    description: SITE_DESCRIPTION,
  };
}

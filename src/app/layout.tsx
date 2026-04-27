/**
 * Root layout for the W3PN org website. Loads Google Fonts (Archivo, Domine, Inter,
 * Material Symbols), forces dark mode, and wraps all pages in OrgLayoutClient.
 */

import type { Metadata, Viewport } from "next";

import "@/components/org/global-footer/global-footer.css";
import "./globals.css";
import "@/styles/org/global.css";
import "@/styles/org/project-detail.css";

import { getOrgDefaultContent } from "@/lib/org/default-content";
import OrgLayoutClient from "@/components/org/OrgLayoutClient";
import PlausibleTracker from "@/components/org/PlausibleTracker";
import {
  DEFAULT_SHARE_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Web3 privacy",
    "digital freedom",
    "privacy advocacy",
    "cypherpunk",
    "privacy events",
    "Web3Privacy Now",
  ],
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [{ url: DEFAULT_SHARE_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : {}),
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = getOrgDefaultContent();
  const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd());
  const websiteJsonLd = JSON.stringify(buildWebsiteJsonLd());
  const plausibleScriptSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC?.trim() || undefined;
  const plausibleEndpoint = process.env.NEXT_PUBLIC_PLAUSIBLE_ENDPOINT?.trim() || undefined;
  const plausibleLegacyDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || undefined;
  const plausibleCaptureOnLocalhost =
    process.env.NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST === "1" ||
    process.env.NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST === "true";

  return (
    <html lang="en" className="dark" suppressHydrationWarning style={{ colorScheme: "dark" }}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Domine:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <PlausibleTracker
          scriptSrc={plausibleScriptSrc}
          endpoint={plausibleEndpoint}
          legacyDomain={plausibleLegacyDomain}
          captureOnLocalhost={plausibleCaptureOnLocalhost}
        />
        <OrgLayoutClient content={content}>{children}</OrgLayoutClient>
      </body>
    </html>
  );
}

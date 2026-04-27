"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { sanitizeMdxForMarkdown } from "@/lib/org/sanitize-mdx-for-markdown";
import { extractHeadings } from "./OnThisPage";

const GITHUB_DOCS_BASE = "https://github.com/web3privacy/docs/blob/main/src/content/docs";
const RAW_GITHUB_DOCS_BASE = "https://raw.githubusercontent.com/web3privacy/docs/main/src/content/docs";
const GITHUB_PORTAL_BASE =
  "https://github.com/web3privacy/privacy-portal/blob/main/w3pn-org-web/public/data/docs";

function resolveLocalImagePath(slug: string, src: string | undefined): string {
  if (!src || src.startsWith("http")) return src ?? "";
  let baseDir = slug ? `${slug.split("/").slice(0, -1).join("/")}/` : "";
  let rel = src;
  if (rel.startsWith("./")) rel = rel.slice(2);
  while (rel.startsWith("../")) {
    baseDir = baseDir.replace(/\/?[^/]+\/$/, "") || "";
    rel = rel.slice(3);
  }
  const resolved = (baseDir + rel).replace(/\/+/g, "/").replace(/^\//, "");
  return `/org/data/docs/${resolved}`;
}

function resolveRemoteImagePath(slug: string, src: string | undefined): string {
  if (!src || src.startsWith("http")) return src ?? "";
  let baseDir = slug ? `${slug.split("/").slice(0, -1).join("/")}/` : "";
  let rel = src;
  if (rel.startsWith("./")) rel = rel.slice(2);
  while (rel.startsWith("../")) {
    baseDir = baseDir.replace(/\/?[^/]+\/$/, "") || "";
    rel = rel.slice(3);
  }
  const resolved = (baseDir + rel).replace(/\/+/g, "/").replace(/^\//, "");
  return encodeURI(`${RAW_GITHUB_DOCS_BASE}/${resolved}`);
}

function slugify(text: string): string {
  return String(text)
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export default function DocContent({
  slug,
  filePath,
  rawMarkdown,
  editUrl,
  lastUpdated,
  onHeadings,
}: {
  slug: string;
  filePath: string | null;
  rawMarkdown: string;
  editUrl?: string | null;
  lastUpdated?: string | null;
  onHeadings?: (headings: { level: number; text: string; id: string }[]) => void;
}) {
  const body = sanitizeMdxForMarkdown(rawMarkdown ?? "");
  const headings = React.useMemo(() => extractHeadings(body), [body]);
  React.useEffect(() => {
    if (onHeadings) onHeadings(headings);
  }, [headings, onHeadings]);

  const isPortalDoc = slug.startsWith("portal-and-org-web");
  const defaultEditUrl = isPortalDoc
    ? `${GITHUB_PORTAL_BASE}/${slug.replace(/\/$/, "")}.md`
    : filePath
      ? `${GITHUB_DOCS_BASE}/${filePath}`
      : `${GITHUB_DOCS_BASE}/${slug || "index"}.mdx`;
  const editLink = editUrl || defaultEditUrl;

  const breadcrumbParts = slug ? slug.split("/") : [];
  const pathSegments = breadcrumbParts.map((s, i) => ({
    label: s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    path: breadcrumbParts.slice(0, i + 1).join("/"),
  }));

  const basePath = "/docs";

  return (
    <article className="docs-content">
      <nav className="docs-breadcrumb" aria-label="Breadcrumb">
        <Link href="/org">Home</Link>
        <span className="docs-breadcrumb-sep" aria-hidden>→</span>
        <Link href={basePath}>Docs</Link>
        {pathSegments.map((seg, i) => (
          <React.Fragment key={i}>
            <span className="docs-breadcrumb-sep" aria-hidden>→</span>
            {i < pathSegments.length - 1 ? (
              <Link href={`${basePath}/${seg.path}`}>{seg.label}</Link>
            ) : (
              <span aria-current="page">{seg.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="docs-body">
        <ReactMarkdown
          components={{
            h2: ({ children, ...props }) => {
              const flat = React.Children.toArray(children);
              const first = flat[0];
              const text = typeof first === "string" ? first : "";
              return (
                <h2 id={slugify(text)} {...props}>
                  {children}
                </h2>
              );
            },
            h3: ({ children, ...props }) => {
              const flat = React.Children.toArray(children);
              const first = flat[0];
              const text = typeof first === "string" ? first : "";
              return (
                <h3 id={slugify(text)} {...props}>
                  {children}
                </h3>
              );
            },
            a: ({ href, ...props }) => {
              const h = typeof href === "string" ? href : "";
              if (h.startsWith("http")) return <a href={h} target="_blank" rel="noopener noreferrer" {...props} />;
              if (h.startsWith("/")) return <Link href={h} {...props} />;
              return <a href={h} {...props} />;
            },
            img: ({ src, alt, ...props }) => {
              const srcStr = typeof src === "string" ? src : "";
              const isRelative =
                srcStr.startsWith("./") ||
                srcStr.startsWith("../") ||
                (srcStr.startsWith("assets/") && !srcStr.startsWith("http"));
              const resolvedSrc = isRelative
                ? (isPortalDoc ? resolveLocalImagePath(slug, srcStr) : resolveRemoteImagePath(slug, srcStr))
                : srcStr;
              return <img src={resolvedSrc} alt={alt ?? ""} loading="lazy" {...props} />;
            },
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
      <div className="docs-meta">
        <a
          href={editLink}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-btn docs-edit-btn"
        >
          EDIT PAGE
        </a>
        {lastUpdated && <p className="docs-last-updated">Last updated: {lastUpdated}</p>}
      </div>
    </article>
  );
}

"use client";

import { useState } from "react";
import { getArticleDisplayImageUrl } from "@/lib/org/article-preview";
import { useArticlesInitialLimit } from "@/hooks/use-articles-initial-limit";

type Article = { href: string; thumbnail?: string; date?: string; title?: string; excerpt?: string };

function formatArticleDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} - ${hh}:${min}`;
}

export function ProjectDetailArticles({ articles }: { articles: Article[] | undefined }) {
  const initialLimit = useArticlesInitialLimit();
  const [expanded, setExpanded] = useState(false);
  if (!articles?.length) return null;

  const needsCollapse = articles.length > initialLimit;
  const visible = !needsCollapse || expanded ? articles : articles.slice(0, initialLimit);

  return (
    <section className="event-detail-section event-detail-articles-section project-detail-section">
      <img src="/images/projects/detail/assets/title-articles.webp" alt="ARTICLES" className="project-detail-section-title-img" width={180} height={40} />
      <div className="event-detail-articles-list" style={{ marginTop: 24 }}>
        {visible.map((a, i) => (
          <a
            key={`${a.href || ""}-${i}`}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className="event-detail-article-card"
          >
            <div className="event-detail-article-card-image">
              <img
                src={getArticleDisplayImageUrl({
                  title: a.title ?? a.href ?? `Article ${i + 1}`,
                  subtitle: a.excerpt,
                  explicitImage: a.thumbnail,
                  kind: "project",
                  seed: `${a.href || a.title || i}`,
                })}
                alt=""
                loading="lazy"
              />
            </div>
            <div className="event-detail-article-card-content" style={{ minWidth: 0 }}>
              <time dateTime={a.date} className="event-detail-article-date">{formatArticleDate(a.date)}</time>
              <h3 className="event-detail-article-title">{a.title}</h3>
              {a.excerpt && <p className="event-detail-article-perex">{a.excerpt}</p>}
            </div>
          </a>
        ))}
      </div>
      {needsCollapse && (
        <div className="event-detail-talks-show-all-wrap project-detail-articles-show-all-wrap">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="event-detail-speakers-show-all"
          >
            {expanded ? "Show less" : "Show all articles"}
          </button>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { getArticleDisplayImageUrl } from "@/lib/org/article-preview";
import type { EventDetailArticles } from "@/types/event-detail";
import type { Article } from "@/types/news";
import { useArticlesInitialLimit } from "@/hooks/use-articles-initial-limit";

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

type Props = {
  section: EventDetailArticles;
  articles: Article[];
};

export function OrgEventDetailArticles({ section, articles }: Props) {
  const initialLimit = useArticlesInitialLimit();
  const [expanded, setExpanded] = useState(false);
  if (!section.enabled || !section.articleIds?.length) return null;

  const items = section.articleIds
    .map((id) => articles.find((a) => a.id === id))
    .filter((a): a is Article => !!a);

  if (items.length === 0) return null;

  const needsCollapse = items.length > initialLimit;
  const visible = !needsCollapse || expanded ? items : items.slice(0, initialLimit);

  return (
    <section id="articles" className="event-detail-section event-detail-articles-section">
      <img
        src="/images/events/detail/assets/articles-heading.webp"
        alt="ARTICLES"
        className="event-detail-topics-links-heading-img event-detail-articles-heading"
        width={200}
        height={40}
      />
      <div className="event-detail-articles-list">
        {visible.map((article) => {
          const href = article.hasDetail ? `/news/${article.id}` : article.link;
          const isExternal = !article.hasDetail;
          const imageUrl = getArticleDisplayImageUrl({
            title: article.title,
            subtitle: article.perex,
            explicitImage: article.imageUrl,
            kind: "news",
            seed: article.id,
          });
          return (
            <a
              key={article.id}
              href={href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="event-detail-article-card"
            >
              <div className="event-detail-article-card-image">
                <img src={imageUrl} alt="" loading="lazy" />
              </div>
              <div className="event-detail-article-card-content">
                <time dateTime={article.date} className="event-detail-article-date">
                  {formatArticleDate(article.date)}
                </time>
                <h3 className="event-detail-article-title">{article.title}</h3>
                {article.perex && (
                  <p className="event-detail-article-perex">{article.perex}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
      {needsCollapse && (
        <div className="event-detail-talks-show-all-wrap" style={{ marginTop: 16 }}>
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

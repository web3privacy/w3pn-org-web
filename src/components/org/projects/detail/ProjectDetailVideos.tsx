"use client";

import { useEffect, useState } from "react";
import {
  PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT,
  useProjectDetailVideosCollapsedLimit,
} from "@/hooks/use-project-detail-videos-limit";

type VideoEntry = {
  youtubeId: string;
  title?: string;
  speaker?: string;
  role?: string;
};

export function ProjectDetailVideos({ videos }: { videos: VideoEntry[] | undefined }) {
  const collapsedLimit = useProjectDetailVideosCollapsedLimit();
  const [expanded, setExpanded] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [titleImageFailed, setTitleImageFailed] = useState(false);
  const videosList = videos ?? [];

  const needsCollapse = Number.isFinite(collapsedLimit) && videosList.length > collapsedLimit;
  const visibleVideos =
    !needsCollapse || expanded ? videosList : videosList.slice(0, PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT);
  const activePlayingVideoId = visibleVideos.some((video) => video.youtubeId === playingVideoId)
    ? playingVideoId
    : null;

  if (!videosList.length) return null;

  return (
    <section className="event-detail-section event-detail-talks-section project-detail-section">
      {titleImageFailed ? (
        <h2 className="project-detail-section-title-fallback">VIDEOS</h2>
      ) : (
        <img
          src="/images/projects/detail/assets/title-videos.webp"
          alt="VIDEOS"
          className="project-detail-section-title-img"
          width={180}
          height={40}
          onError={() => setTitleImageFailed(true)}
        />
      )}
      <div className="event-detail-talks-grid">
        {visibleVideos.map((v, i) => (
          <div key={v.youtubeId || i} className="event-detail-talk-card">
            <div className="event-detail-talk-thumb">
              {activePlayingVideoId === v.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={v.title || "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="event-detail-talk-iframe"
                />
              ) : (
                <button type="button" className="event-detail-talk-poster" onClick={() => setPlayingVideoId(v.youtubeId)}>
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`}
                    alt={v.title || ""}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                  <span className="event-detail-talk-play" aria-hidden>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.7)" />
                      <path d="M20 16v16l14-8-14-8z" fill="#fff" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
            <h4 className="event-detail-talk-speaker">{v.speaker || "Speaker"}</h4>
            {v.role && <p className="event-detail-talk-role">{v.role}</p>}
            {v.title && <p className="event-detail-talk-title">&ldquo;{v.title}&rdquo;</p>}
            <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="event-detail-talk-yt-link">Watch on YouTube</a>
          </div>
        ))}
      </div>
      {needsCollapse && (
        <div className="event-detail-talks-show-all-wrap project-detail-articles-show-all-wrap">
          <button
            type="button"
            onClick={() => {
              setExpanded((current) => {
                const next = !current;
                if (!next && activePlayingVideoId) {
                  const allowed = new Set(
                    videosList
                      .slice(0, PROJECT_DETAIL_VIDEOS_COLLAPSE_LIMIT)
                      .map((video) => video.youtubeId),
                  );
                  if (!allowed.has(activePlayingVideoId)) {
                    setPlayingVideoId(null);
                  }
                }
                return next;
              });
            }}
            className="event-detail-speakers-show-all"
          >
            {expanded ? "Show less" : "SHOW ALL VIDEOS"}
          </button>
        </div>
      )}
    </section>
  );
}

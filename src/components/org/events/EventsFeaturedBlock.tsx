"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayIcon } from "@/components/org/SharedIcons";
import { passthroughImageLoader } from "@/lib/passthrough-image-loader";
import { parseYoutubeVideoId } from "@/lib/youtube";

type Featured = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  videoThumbnailUrl?: string;
  videoUrl?: string;
};

function isDirectVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

function YoutubePosterImage({ src, ytId }: { src: string; ytId: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const resolvedSrc = useFallback ? `https://img.youtube.com/vi/${ytId}/default.jpg` : src;

  return (
    <Image
      src={resolvedSrc}
      alt=""
      fill
      loader={passthroughImageLoader}
      sizes="(max-width: 768px) 100vw, 360px"
      unoptimized
      onError={() => {
        if (!useFallback && src.includes("/hqdefault.")) {
          setUseFallback(true);
        }
      }}
    />
  );
}

/**
 * Value-centric gatherings block on /events — video uses the same video-card pattern as About.
 */
export function EventsFeaturedBlock({ featured }: { featured: Featured | null | undefined }) {
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const title = featured?.title;
  const description = featured?.description;
  const ctaLabel = featured?.ctaLabel;
  const ctaHref = featured?.ctaHref;
  const videoThumbnailUrl = featured?.videoThumbnailUrl;
  const videoUrl = featured?.videoUrl;
  const hasVideo = !!(videoThumbnailUrl || videoUrl);

  const ytId = videoUrl ? parseYoutubeVideoId(videoUrl) : null;
  const videoPoster =
    (videoThumbnailUrl && String(videoThumbnailUrl).trim()) ||
    (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");

  if (!featured) return null;

  return (
    <section className="events-featured-block">
      <div className="events-featured-inner">
        <div className="events-featured-media">
          {hasVideo && (
            <div className="events-featured-video-wrap">
              {ytId ? (
                <article className="video-card video-card--embed events-featured-youtube-card">
                  <div className="video-card__player">
                    {youtubePlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                        title={title ? `Video: ${title}` : "Featured video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    ) : (
                      <button
                        type="button"
                        className="video-card__poster"
                        onClick={() => setYoutubePlaying(true)}
                        aria-label={title ? `Play video: ${title}` : "Play video"}
                      >
                        {videoPoster ? (
                          <YoutubePosterImage key={videoPoster} src={videoPoster} ytId={ytId} />
                        ) : null}
                        <span className="video-card__poster-shade" aria-hidden />
                        <span className="video-card__play-wrap">
                          <span className="video-card__play-icon">
                            <PlayIcon />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              ) : videoUrl && isDirectVideoFileUrl(videoUrl) ? (
                <video
                  className="events-featured-video"
                  src={videoUrl}
                  poster={videoThumbnailUrl}
                  controls
                  preload="metadata"
                  width={320}
                  height={240}
                />
              ) : (
                videoThumbnailUrl && (
                  <div className="events-featured-thumb">
                    <Image
                      src={videoThumbnailUrl}
                      alt=""
                      fill
                      loader={passthroughImageLoader}
                      sizes="(max-width: 768px) 100vw, 360px"
                      unoptimized
                    />
                    <span className="events-featured-play" aria-hidden>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path fill="currentColor" d="M8 6.5v11l9-5.5-9-5.5z" />
                      </svg>
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
        <div className="events-featured-copy">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
          {ctaLabel && ctaHref && (
            <a href={ctaHref} className="primary-btn events-featured-cta" target="_blank" rel="noopener noreferrer">
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

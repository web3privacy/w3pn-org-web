"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { passthroughImageLoader } from "@/lib/passthrough-image-loader";
import { orgAsset } from "./ProjectDetailLayout";

type Hero = {
  logo?: string;
  graphic?: string;
  backgroundImage?: string;
  title?: string;
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  metrics?: Array<{ value?: string; label?: string; sublabel?: string }>;
  pagination?: string[];
};

type ProjectSummary = { icon?: string; image?: string };

export function ProjectDetailHero({
  hero,
  project,
}: {
  hero: Hero | undefined;
  project?: ProjectSummary;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const [showFloatingBack, setShowFloatingBack] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowFloatingBack(!entry.isIntersecting),
      { threshold: 0, root: null, rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!hero) return null;

  const listingIcon = project?.icon ?? project?.image;
  const graphicSrc = orgAsset(listingIcon || hero.graphic || hero.logo);
  const bgImageSrc = hero.backgroundImage
    ? (hero.backgroundImage.startsWith("http") || hero.backgroundImage.startsWith("/")
        ? hero.backgroundImage
        : `/org/${hero.backgroundImage}`)
    : null;
  const hasDedicatedBg = !!bgImageSrc;

  return (
    <header ref={headerRef} className="project-detail-hero">
      <Link
        href="/projects"
        className={`detail-hero-back-floating ${showFloatingBack ? "detail-hero-back-floating--visible" : ""}`}
        aria-hidden={showFloatingBack ? undefined : true}
        tabIndex={showFloatingBack ? 0 : -1}
      >
        <ChevronLeft className="h-4 w-4" style={{ flexShrink: 0 }} aria-hidden />
        All Projects
      </Link>
      <div
        className="project-detail-hero-media-wrap"
        style={{ marginLeft: "calc(-50vw + 50%)" }}
      >
        <div className="project-detail-hero-nav-fade" aria-hidden />
        <div className="project-detail-hero-bar">
          <Link
            href="/projects"
            className={`project-detail-hero-back${showFloatingBack ? " project-detail-hero-back--concealed" : ""}`}
            tabIndex={showFloatingBack ? -1 : undefined}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            All Projects
          </Link>
        </div>

        {hasDedicatedBg ? (
          <div className="project-detail-hero-bg">
            <Image
              src={bgImageSrc}
              alt=""
              className="project-detail-hero-bg-img project-detail-hero-bg-img--dedicated"
              fill
              loader={passthroughImageLoader}
              sizes="100vw"
              priority
              unoptimized
              aria-hidden
            />
          </div>
        ) : graphicSrc ? (
          <div className="project-detail-hero-bg">
            <Image
              src={graphicSrc}
              alt=""
              className="project-detail-hero-bg-img"
              fill
              loader={passthroughImageLoader}
              sizes="100vw"
              priority
              unoptimized
              aria-hidden
            />
          </div>
        ) : (
          <div className="project-detail-hero-bg-solid" aria-hidden />
        )}

        <div className={`project-detail-hero-inner ${hasDedicatedBg ? "project-detail-hero-inner--centered project-detail-hero-inner--logo-left" : ""}`}>
          <div className={`project-detail-hero-content-block ${hasDedicatedBg ? "project-detail-hero-content-block--logo-left" : ""}`}>
            {graphicSrc && (
              <div className="project-detail-hero-image-wrap">
                <div className="project-detail-hero-image-inner">
                  <Image
                    src={graphicSrc}
                    alt=""
                    className="project-detail-hero-image"
                    fill
                    loader={passthroughImageLoader}
                    sizes="(min-width: 769px) 320px, 200px"
                    priority
                    unoptimized
                  />
                </div>
              </div>
            )}

            <div className={`project-detail-hero-text ${hasDedicatedBg ? "project-detail-hero-text--right" : ""}`}>
              <h1 className="project-detail-hero-title">{hero.title}</h1>
              {hero.tagline && (
                <p className="project-detail-hero-tagline">{hero.tagline}</p>
              )}
              {hero.ctaHref && hero.ctaLabel && (
                <a
                  href={hero.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-detail-hero-cta"
                >
                  {hero.ctaLabel}
                </a>
              )}
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-[160px]"
          style={{
            background: "linear-gradient(0deg, #000000 0%, transparent 100%)",
          }}
          aria-hidden
        />
      </div>

    </header>
  );
}

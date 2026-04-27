"use client";

import Image from "next/image";
import Link from "next/link";
import { passthroughImageLoader } from "@/lib/passthrough-image-loader";
import { saveScrollPosition, PROJECTS_SCROLL_KEY } from "@/lib/scroll-memory";

const ACCENT = "#70ff88";

/** Clickable span that opens URL in new tab. Use instead of <a> when inside a Link to avoid nested anchor hydration error. */
function ExternalLinkSpan({
  href,
  children,
  style,
  title,
}: {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <span
      role="link"
      tabIndex={0}
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }}
      style={{
        cursor: "pointer",
        display: "inline-block",
        maxWidth: "100%",
        minWidth: 0,
        verticalAlign: "top",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type Project = {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  /** Optional per-card overrides (see data/org/projects/index.yaml). */
  links?: { url?: string; github?: string; docs?: string; cardHref?: string; urlNote?: string };
};

export type CardVariant = "default" | "infrastructure" | "infrastructure-row" | "education" | "category-row";

export function ProjectCard({
  project,
  variant = "default",
}: {
  project: Project;
  variant?: CardVariant;
}) {
  if (variant === "infrastructure-row") {
    return <ProjectCardInfrastructureRow project={project} />;
  }
  if (variant === "infrastructure") {
    return <ProjectCardInfrastructure project={project} />;
  }
  if (variant === "education") {
    return <ProjectCardEducation project={project} />;
  }
  if (variant === "category-row") {
    return <ProjectCardCategoryRow project={project} />;
  }
  return <ProjectCardDefault project={project} />;
}

function handleProjectCardClick() {
  saveScrollPosition(PROJECTS_SCROLL_KEY);
}

function getDisplayUrl(project: Project): string {
  if (project.links?.url) {
    try {
      return new URL(project.links.url).hostname;
    } catch {
      return project.links.url;
    }
  }
  if (project.links?.github) return project.links.github.replace("https://", "");
  if (project.links?.docs) return project.links.docs.replace("https://", "");
  return "";
}

function getPrimaryHref(project: Project): { href: string; external: boolean } {
  const url = project.links?.url ?? project.links?.docs ?? project.links?.github;
  if (url?.startsWith("http")) return { href: url, external: true };
  return { href: `/projects/${project.id}`, external: false };
}

/** Internal link to org project detail (always available). */
function getDetailHref(project: Project): string {
  return `/projects/${project.id}`;
}

function getUrlNote(project: Project): string {
  const n = project.links?.urlNote;
  return typeof n === "string" ? n.trim() : "";
}

/** When set to an app path (e.g. /privacy-portal), the whole card links there instead of the project detail page. */
function getCardLinkHref(project: Project): string {
  const h = project.links?.cardHref;
  if (typeof h === "string" && h.startsWith("/")) return h;
  return getDetailHref(project);
}

const INFRASTRUCTURE_DESC =
  "The explorer's main focus is to bring privacy-focused projects first. Allowing anyone to discover projects without being identified or personally tracked.";

function getInfrastructureDescription(project: Project): string {
  return project.description ?? INFRASTRUCTURE_DESC;
}

function ProjectCardIconImage({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      fill
      loader={passthroughImageLoader}
      sizes="(max-width: 768px) 72px, 160px"
      unoptimized
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

function ProjectCardMobileArticle({
  project,
  description,
}: {
  project: Project;
  description: string;
}) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  return (
    <div className="project-card-mobile-card">
      <div className="project-card-mobile-media" style={{ position: "relative" }}>
        <ProjectCardIconImage src={icon} className="project-card-mobile-image" />
      </div>
      <div className="project-card-mobile-content">
        <h3 className="project-card-mobile-title">{String(project.name ?? project.id)}</h3>
        <p className="project-card-mobile-description">{description}</p>
        {urlNote ? (
          <span className="project-card-mobile-meta">{urlNote}</span>
        ) : (
          external &&
          displayUrl && (
            <ExternalLinkSpan
              href={externalUrl}
              title={displayUrl}
              style={{ whiteSpace: "normal" }}
            >
              <span className="project-card-mobile-meta project-card-mobile-meta--link">{displayUrl}</span>
            </ExternalLinkSpan>
          )
        )}
      </div>
    </div>
  );
}

function ProjectCardEducation({ project }: { project: Project }) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const cardHref = getCardLinkHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  const desktopContent = (
    <article
      className="project-card project-card--stacked project-card-desktop-card project-card-desktop-card--stacked-center"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "#000000",
        padding: 24,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="project-card-media"
        style={{
          position: "relative",
          width: 160,
          height: 160,
          margin: "0 auto 16px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProjectCardIconImage src={icon} />
      </div>
      <div
        className="project-card-body"
        style={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h3
          className="project-card-title"
          style={{
            fontFamily: "Archivo, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          {String(project.name ?? project.id)}
        </h3>
        <p
          className="project-card-description"
          style={{
            margin: "12px 0 0",
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          {project.description ?? ""}
        </p>
        <div
          className="project-card-meta"
          style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          {urlNote ? (
            <span
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.86)",
                textAlign: "center",
              }}
            >
              {urlNote}
            </span>
          ) : (
            external &&
            displayUrl && (
              <ExternalLinkSpan
                href={externalUrl}
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.86)",
                  textDecoration: "none",
                }}
              >
                {displayUrl}
              </ExternalLinkSpan>
            )
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={cardHref}
      onPointerDownCapture={handleProjectCardClick}
      onClick={handleProjectCardClick}
      className="project-card-hit"
      style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
    >
      <>
        {desktopContent}
        <ProjectCardMobileArticle project={project} description={project.description ?? ""} />
      </>
    </Link>
  );
}

function ProjectCardCategoryRow({ project }: { project: Project }) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const cardHref = getCardLinkHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  const desktopContent = (
    <article
      className="project-card project-card-row project-card-desktop-card project-card-desktop-card--row"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "#000000",
        padding: 24,
        transition: "transform 0.2s, box-shadow 0.2s",
        flex: 1,
        minHeight: 0,
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="project-card-media"
        style={{
          position: "relative",
          width: 160,
          height: 160,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProjectCardIconImage src={icon} />
      </div>
      <div
        className="project-card-body"
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          textAlign: "left",
        }}
      >
        <h3
          className="project-card-title"
          style={{
            fontFamily: "Archivo, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {String(project.name ?? project.id)}
        </h3>
        <p
          className="project-card-description"
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project.description ?? ""}
        </p>
        <div className="project-card-meta" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {urlNote ? (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.86)" }}>{urlNote}</span>
          ) : (
            external &&
            displayUrl && (
              <ExternalLinkSpan
                href={externalUrl}
                title={displayUrl}
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.86)",
                  textDecoration: "none",
                }}
              >
                {displayUrl}
              </ExternalLinkSpan>
            )
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={cardHref}
      onPointerDownCapture={handleProjectCardClick}
      onClick={handleProjectCardClick}
      className="project-card-hit"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        height: "100%",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <>
        {desktopContent}
        <ProjectCardMobileArticle project={project} description={project.description ?? ""} />
      </>
    </Link>
  );
}

function ProjectCardInfrastructureRow({ project }: { project: Project }) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const cardHref = getCardLinkHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  const desktopContent = (
    <article
      className="project-card project-card-row project-card-desktop-card project-card-desktop-card--row"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "#000000",
        padding: 24,
        transition: "transform 0.2s, box-shadow 0.2s",
        flex: 1,
        minHeight: 0,
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="project-card-media"
        style={{
          position: "relative",
          width: 160,
          height: 160,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProjectCardIconImage src={icon} />
      </div>
      <div
        className="project-card-body"
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          textAlign: "left",
        }}
      >
        <h3
          className="project-card-title"
          style={{
            fontFamily: "Archivo, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {String(project.name ?? project.id)}
        </h3>
        <p
          className="project-card-description"
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {getInfrastructureDescription(project)}
        </p>
        <div className="project-card-meta" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {urlNote ? (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.86)" }}>{urlNote}</span>
          ) : (
            external &&
            displayUrl && (
              <ExternalLinkSpan
                href={externalUrl}
                title={displayUrl}
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.86)",
                  textDecoration: "none",
                }}
              >
                {displayUrl}
              </ExternalLinkSpan>
            )
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={cardHref}
      onPointerDownCapture={handleProjectCardClick}
      onClick={handleProjectCardClick}
      className="project-card-hit"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        height: "100%",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <>
        {desktopContent}
        <ProjectCardMobileArticle project={project} description={getInfrastructureDescription(project)} />
      </>
    </Link>
  );
}

function ProjectCardInfrastructure({ project }: { project: Project }) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const cardHref = getCardLinkHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  const desktopContent = (
    <article
      className="project-card project-card--stacked project-card-desktop-card project-card-desktop-card--stacked-center"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "#000000",
        padding: 24,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="project-card-media"
        style={{
          position: "relative",
          width: 160,
          height: 160,
          margin: "0 auto 16px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProjectCardIconImage src={icon} />
      </div>
      <div
        className="project-card-body"
        style={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h3
          className="project-card-title"
          style={{
            fontFamily: "Archivo, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          {String(project.name ?? project.id)}
        </h3>
        <p
          className="project-card-description"
          style={{
            margin: "12px 0 0",
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          {getInfrastructureDescription(project)}
        </p>
        <div
          className="project-card-meta"
          style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          {urlNote ? (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.86)", textAlign: "center" }}>{urlNote}</span>
          ) : (
            external &&
            displayUrl && (
              <ExternalLinkSpan
                href={externalUrl}
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.86)",
                  textDecoration: "none",
                }}
              >
                {displayUrl}
              </ExternalLinkSpan>
            )
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={cardHref}
      onPointerDownCapture={handleProjectCardClick}
      onClick={handleProjectCardClick}
      className="project-card-hit"
      style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
    >
      <>
        {desktopContent}
        <ProjectCardMobileArticle project={project} description={getInfrastructureDescription(project)} />
      </>
    </Link>
  );
}

function ProjectCardDefault({ project }: { project: Project }) {
  const displayUrl = getDisplayUrl(project);
  const { href: externalUrl, external } = getPrimaryHref(project);
  const cardHref = getCardLinkHref(project);
  const urlNote = getUrlNote(project);
  const icon = project.icon ?? "/images/projects/page/assets/projects/explorer-logo.svg";

  const desktopContent = (
    <article
      className="project-card project-card--stacked project-card-desktop-card project-card-desktop-card--stacked-left"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "#000000",
        padding: 24,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        className="project-card-media"
        style={{ position: "relative", width: 160, height: 160, marginBottom: 16, flexShrink: 0 }}
      >
        <ProjectCardIconImage src={icon} />
      </div>
      <div
        className="project-card-body"
        style={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <h3
          className="project-card-title"
          style={{
            fontFamily: "Archivo, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {String(project.name ?? project.id)}
        </h3>
        <p
          className="project-card-description"
          style={{
            margin: "12px 0 0",
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project.description ?? ""}
        </p>
        <div className="project-card-meta" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>
            View project details →
          </span>
          {urlNote ? (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{urlNote}</span>
          ) : external ? (
            <ExternalLinkSpan
              href={externalUrl}
              style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
            >
              {displayUrl || "Visit website"} ↗
            </ExternalLinkSpan>
          ) : displayUrl ? (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{displayUrl}</span>
          ) : null}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={cardHref}
      onPointerDownCapture={handleProjectCardClick}
      onClick={handleProjectCardClick}
      className="project-card-hit"
      style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
    >
      <>
        {desktopContent}
        <ProjectCardMobileArticle project={project} description={project.description ?? ""} />
      </>
    </Link>
  );
}

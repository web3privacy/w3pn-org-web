"use client";

import { useOrgContent } from "@/lib/org/OrgContentContext";
import { Icon } from "@/components/ui/icon";
import { ProjectCard } from "./ProjectCard";
import type { ProjectListItem } from "@/components/org/OrgProjectsContent";

const TITLE_IMAGES: Record<string, string> = {
  infrastructure: "/images/projects/page/assets/title-infrastructure.png",
  education: "/images/projects/page/assets/title-education.png",
  tools: "/images/projects/page/assets/title-tools.png",
  research: "/images/projects/page/assets/title-research.png",
  media: "/images/projects/page/assets/title-media.png",
};

function ProjectsOtherLinks() {
  const content = useOrgContent();
  const links = ((content?.projectsPage as Record<string, unknown>)?.otherLinks ?? []) as Array<{
    label: string;
    href: string;
  }>;
  if (links.length === 0) return null;

  return (
    <section style={{ marginTop: 0, paddingTop: 16 }} className="projects-other-section">
      <img
        src="/images/projects/page/assets/title-other.png"
        alt="OTHER"
        className="projects-title-image"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {links.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="projects-other-link"
            aria-label={`${item.label} (opens in new tab)`}
            title={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "#000000",
              textDecoration: "none",
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
            <span className="projects-other-label">
              {item.label}
            </span>
            <Icon
              name="open_in_new"
              size={18}
              className="projects-other-external-icon"
              title="Open external link"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

export type CardLayout = "three-column" | "two-column" | "row";

/** First row of infrastructure: three compact cards (desktop / tablet). */
const INFRASTRUCTURE_TOP_ROW_IDS = ["privacy-explorer", "privacy-portal", "jobs"] as const;
/** Below the first row: full-width row cards (desktop / tablet). */
const INFRASTRUCTURE_FULL_WIDTH_IDS = ["gitcoin-privacy-round", "drips-for-privacy"] as const;
/** Desktop-only wide row cards that should span the full section width. */
const DESKTOP_WIDE_ROW_IDS = new Set(["cypherpunk-launchpad", "ethereum-privacy-hackathon-overview"]);

function getGridStyle(
  layout: CardLayout,
  cat: string,
  _projectCount: number
): React.CSSProperties {
  if ((layout === "row" || cat === "tools" || cat === "research" || cat === "media") && cat !== "education") {
    return {
      display: "flex",
      flexDirection: "column",
      gap: 24,
    };
  }
  if (layout === "three-column" || cat === "education" || cat === "infrastructure") {
    return {
      display: "grid",
      gap: 24,
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    };
  }
  if (layout === "two-column") {
    return {
      display: "grid",
      gap: 24,
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    };
  }
  return {
    display: "grid",
    gap: 24,
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  };
}

type ProjectsByCategoryProps = {
  projectsByCategory: Record<string, ProjectListItem[]>;
  categoryOrder: string[];
  categoryLabels: Record<string, string>;
};

export function ProjectsByCategory({
  projectsByCategory,
  categoryOrder,
  categoryLabels,
}: ProjectsByCategoryProps) {
  const content = useOrgContent();
  const cardLayout = ((content?.projectsPage as Record<string, unknown>)?.cardLayout ?? "two-column") as CardLayout;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {categoryOrder.map((cat) => {
        const projects = projectsByCategory[cat] ?? [];
        if (projects.length === 0) return null;

        const isInfrastructure = cat === "infrastructure";
        const isEducation = cat === "education";
        const isTools = cat === "tools";
        const isResearch = cat === "research";
        const isMedia = cat === "media";
        const gridStyle = getGridStyle(cardLayout, cat, projects.length);

        const isDesktopWideRow = (projectId: string) => DESKTOP_WIDE_ROW_IDS.has(projectId);

        const getCardVariant = (p: ProjectListItem, fullWidth: boolean) =>
          isInfrastructure && (cardLayout === "row" || fullWidth)
            ? ("infrastructure-row" as const)
            : isInfrastructure
              ? ("infrastructure" as const)
              : isDesktopWideRow(p.id)
                ? ("category-row" as const)
              : isEducation
                ? ("education" as const)
                : isTools || isResearch || isMedia
                  ? ("category-row" as const)
                  : ("default" as const);

        const renderProject = (p: ProjectListItem, fullWidth = false, useGridColumnSpan = true) => (
          <div
            key={p.id}
            data-project-id={p.id}
            className={isDesktopWideRow(p.id) ? "projects-grid-item--desktop-wide-row" : undefined}
            style={
              fullWidth
                ? cardLayout === "row" || !useGridColumnSpan
                  ? { width: "100%", minWidth: 0 }
                  : { gridColumn: "1 / -1", width: "100%", minWidth: 0 }
                : undefined
            }
          >
            <ProjectCard project={p} variant={getCardVariant(p, fullWidth)} />
          </div>
        );

        const infrastructureSplit =
          isInfrastructure && cardLayout !== "row" && projects.length > 0;

        const infrastructureTopRow = infrastructureSplit
          ? INFRASTRUCTURE_TOP_ROW_IDS.map((id) => projects.find((p) => p.id === id)).filter(
              (p): p is ProjectListItem => Boolean(p)
            )
          : [];

        const infrastructureFullWidth = infrastructureSplit
          ? INFRASTRUCTURE_FULL_WIDTH_IDS.map((id) => projects.find((p) => p.id === id)).filter(
              (p): p is ProjectListItem => Boolean(p)
            )
          : [];

        const infrastructureTopIds = new Set(infrastructureTopRow.map((p) => p.id));
        const infrastructureWideIds = new Set(infrastructureFullWidth.map((p) => p.id));
        const infrastructureRest = infrastructureSplit
          ? projects.filter((p) => !infrastructureTopIds.has(p.id) && !infrastructureWideIds.has(p.id))
          : [];

        return (
          <section key={cat} data-projects-category={cat} style={{ paddingTop: 16 }}>
            <img
              src={TITLE_IMAGES[cat]}
              alt={categoryLabels[cat] ?? cat}
              className="projects-title-image"
            />
            {infrastructureSplit ? (
              <div
                className="projects-infrastructure-layout"
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                <div
                  className="projects-category-grid projects-infrastructure-row1"
                  style={{
                    display: "grid",
                    gap: 24,
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  {infrastructureTopRow.map((p) => renderProject(p, false))}
                </div>
                <div
                  className="projects-category-grid projects-infrastructure-wide"
                  style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}
                >
                  {infrastructureFullWidth.map((p) => renderProject(p, true, false))}
                  {infrastructureRest.map((p) => renderProject(p, true, false))}
                </div>
              </div>
            ) : (
              <div className="projects-category-grid" style={gridStyle}>
                {projects.map((p) =>
                  renderProject(p, cardLayout === "row" || isTools || isResearch || isMedia)
                )}
              </div>
            )}
          </section>
        );
      })}
      <ProjectsOtherLinks />
    </div>
  );
}

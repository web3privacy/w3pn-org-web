import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectDetail } from "@/lib/org/w3pn-projects";
import { getOrgDefaultContent } from "@/lib/org/default-content";
import { ProjectDetailLayout } from "@/components/org/projects/detail/ProjectDetailLayout";
import { ProjectDetailHero } from "@/components/org/projects/detail/ProjectDetailHero";
import { ProjectDetailHighlights } from "@/components/org/projects/detail/ProjectDetailHighlights";
import { ProjectDetailMissionLinks } from "@/components/org/projects/detail/ProjectDetailMissionLinks";
import { ProjectDetailFeatures } from "@/components/org/projects/detail/ProjectDetailFeatures";
import { ProjectDetailArticles } from "@/components/org/projects/detail/ProjectDetailArticles";
import { ProjectDetailRoadmap } from "@/components/org/projects/detail/ProjectDetailRoadmap";
import { ProjectDetailTestimonials } from "@/components/org/projects/detail/ProjectDetailTestimonials";
import { ProjectDetailContribute } from "@/components/org/projects/detail/ProjectDetailContribute";
import { ProjectDetailFeedback } from "@/components/org/projects/detail/ProjectDetailFeedback";
import { ProjectDetailTeam } from "@/components/org/projects/detail/ProjectDetailTeam";
import { ProjectDetailPartners } from "@/components/org/projects/detail/ProjectDetailPartners";
import { ProjectDetailPlaceholder } from "@/components/org/projects/detail/ProjectDetailPlaceholder";
import { ProjectDetailScreenshots } from "@/components/org/projects/detail/ProjectDetailScreenshots";
import { ProjectDetailDonate } from "@/components/org/projects/detail/ProjectDetailDonate";
import { ProjectDetailVideos } from "@/components/org/projects/detail/ProjectDetailVideos";
import { absoluteUrl, buildMetadata, SITE_NAME, SITE_URL } from "@/lib/site-config";

type MetadataProject = {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  category?: string;
};

type ProjectMetadataDetail = {
  hero?: {
    title?: string;
    tagline?: string;
    backgroundImage?: string;
    graphic?: string;
    logo?: string;
  };
  mission?: {
    text?: string;
  };
  screenshots?: Array<{
    src?: string;
    previewSrc?: string;
    thumbnailSrc?: string;
  }>;
};

function resolveProjectShareImage(project: MetadataProject | undefined, detail: ProjectMetadataDetail | null): string | undefined {
  const hero = detail?.hero;
  const screenshots = detail?.screenshots ?? [];
  const candidate =
    hero?.backgroundImage ||
    screenshots[0]?.previewSrc ||
    screenshots[0]?.src ||
    hero?.graphic ||
    hero?.logo ||
    project?.icon ||
    project?.image;

  if (!candidate) return undefined;
  if (candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("/")) {
    return candidate;
  }
  return `/org/${candidate.replace(/^\/+/, "")}`;
}

function summarizeText(text: string | undefined, fallback: string): string {
  if (!text) return fallback;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 220 ? `${normalized.slice(0, 217).trimEnd()}...` : normalized;
}

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = getProject(projectId) as MetadataProject | undefined;
  const detail = getProjectDetail(projectId) as ProjectMetadataDetail | null;
  const projectName = String(detail?.hero?.title ?? project?.name ?? projectId);
  const shareImage = resolveProjectShareImage(project, detail);
  const projectDescription = summarizeText(
    detail?.mission?.text ?? detail?.hero?.tagline ?? project?.description,
    `Explore the ${projectName} project by Web3Privacy Now.`,
  );
  return buildMetadata({
    title: project ? projectName : "Project",
    description: projectDescription,
    path: `/projects/${projectId}`,
    type: "article",
    images: shareImage ? [shareImage] : undefined,
  });
}

type VideoEntry = {
  youtubeId: string;
  title?: string;
  speaker?: string;
  role?: string;
};

type Detail = Record<string, unknown> & {
  hero?: unknown;
  mission?: unknown;
  links?: unknown;
  features?: unknown;
  articles?: unknown[];
  articlesHrefAll?: string;
  videos?: VideoEntry[];
  roadmap?: unknown[];
  roadmapPagination?: unknown;
  testimonials?: unknown[];
  testimonialsReadMoreHref?: string;
  contribute?: unknown;
  donate?: unknown;
  team?: unknown[];
  partners?: unknown[];
  footer?: unknown;
  sections?: Record<string, boolean>;
};

function showSection(sections: Record<string, boolean> | undefined, id: string): boolean {
  return sections?.[id] !== false;
}

export default async function OrgProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  const detail = getProjectDetail(projectId) as Detail | null;

  if (!project) notFound();

  const proj = project as { name?: string; description?: string; icon?: string; image?: string; category?: string; links?: { url?: string; docs?: string; github?: string } };
  const metaDetail = detail as ProjectMetadataDetail | null;
  const projectTitle = String(metaDetail?.hero?.title ?? proj.name ?? projectId);
  const projectDescription = summarizeText(
    metaDetail?.mission?.text ?? metaDetail?.hero?.tagline ?? proj.description,
    `Explore the ${projectTitle} project by Web3Privacy Now.`,
  );
  const shareImage = resolveProjectShareImage(proj, metaDetail);
  const external = proj.links?.url ?? proj.links?.docs ?? proj.links?.github;
  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: projectTitle,
    description: projectDescription,
    url: absoluteUrl(`/projects/${projectId}`),
    image: shareImage ? [absoluteUrl(shareImage)] : undefined,
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: proj.category ? [proj.category, "Web3 privacy"] : ["Web3 privacy"],
    sameAs: [proj.links?.url, proj.links?.docs, proj.links?.github].filter(Boolean),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: absoluteUrl("/projects"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: projectTitle,
        item: absoluteUrl(`/projects/${projectId}`),
      },
    ],
  };

  // No detail: show external link or "detail not available"
  if (!detail) {
    if (external?.startsWith("http")) {
      return (
        <main className="landing-root" style={{ minHeight: "100vh", paddingTop: "82px" }}>
          <div className="page-content-wrap page-content-wrap--with-padding" style={{ padding: "82px 24px 48px", textAlign: "center" }}>
            <h1 style={{ color: "#f2f4f6" }}>{proj.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.8)" }}>Visit the project:</p>
            <a href={external} target="_blank" rel="noopener noreferrer" style={{ color: "#70ff88", fontSize: 18 }}>
              {external}
            </a>
            <p style={{ marginTop: 24 }}>
              <Link href="/projects" style={{ color: "#70ff88" }}>← All Projects</Link>
            </p>
          </div>
        </main>
      );
    }
    return (
      <main className="landing-root" style={{ minHeight: "100vh", paddingTop: "82px" }}>
        <div className="page-content-wrap page-content-wrap--with-padding" style={{ padding: "82px 24px 48px", textAlign: "center" }}>
          <h1 style={{ color: "#f2f4f6" }}>Detail not available</h1>
          <Link href="/projects" style={{ color: "#70ff88" }}>← All Projects</Link>
        </div>
      </main>
    );
  }

  const hasFeatures =
    (Array.isArray(detail.features) && detail.features.length > 0) ||
    (detail.features && typeof detail.features === "object" && (
      ((detail.features as { cards?: unknown[] }).cards?.length ?? 0) > 0 ||
      ((detail.features as { items?: unknown[] }).items?.length ?? 0) > 0
    ));

  const hero = detail.hero as { metrics?: Array<{ value?: string; label?: string; sublabel?: string }> } | undefined;

  const content = getOrgDefaultContent();

  // Use project testimonials when available; otherwise fall back to homepage placeholder data
  const defaultTestimonials = (content.testimonials as { items?: Array<{ name?: string; role?: string; image?: string; quote?: string }> })?.items ?? [];
  const displayTestimonials = (detail.testimonials as Array<{ avatar?: string; name?: string; role?: string; quote?: string }> | undefined)?.length
    ? (detail.testimonials as Array<{ avatar?: string; name?: string; role?: string; quote?: string }>)
    : defaultTestimonials.map((t) => ({ avatar: t.image, name: t.name, role: t.role, quote: t.quote }));

  // Use project team when available; otherwise fall back to about.team placeholder data
  const defaultTeam = (content.about as { team?: { members?: Array<{ name?: string; role?: string; image?: string }> } })?.team?.members ?? [];
  const displayTeam = (detail.team as Array<{ avatar?: string; name?: string; role?: string }> | undefined)?.length
    ? (detail.team as Array<{ avatar?: string; name?: string; role?: string }>)
    : defaultTeam.map((m) => ({ avatar: m.image, name: m.name, role: m.role }));

  // Use project partners when available; otherwise fall back to projectDetailPlaceholders.partners, then content.partners
  const phPartners = (content.projectDetailPlaceholders as { partners?: Array<{ name?: string; logo?: string; href?: string; description?: string }> })?.partners;
  const legacyPartners = ((content.partners as { logos?: Array<{ name?: string; image?: string }> })?.logos ?? []).map((p) => ({ name: p.name, logo: p.image }));
  const defaultPartners = (phPartners?.length ? phPartners : legacyPartners) as Array<{ name?: string; logo?: string; href?: string; description?: string }>;
  const displayPartners = (detail.partners as Array<{ name?: string; logo?: string; href?: string; description?: string }> | undefined)?.length
    ? (detail.partners as Array<{ name?: string; logo?: string; href?: string; description?: string }>)
    : defaultPartners;

  // Use project articles when available; otherwise fall back to placeholder articles
  const defaultArticles = (content.projectDetailPlaceholders as { articles?: Array<{ href?: string; title?: string; date?: string; excerpt?: string; thumbnail?: string }> })?.articles ?? [];
  const displayArticles = (detail.articles as Array<{ href?: string; title?: string; date?: string; excerpt?: string; thumbnail?: string }> | undefined)?.length
    ? (detail.articles as Array<{ href?: string; title?: string; date?: string; excerpt?: string; thumbnail?: string }>)
    : defaultArticles;

  const sections = (detail.sections ?? {}) as Record<string, boolean>;
  const showMission = showSection(sections, "missionLinks");
  const showShots = showSection(sections, "screenshots");
  const shotList = detail.screenshots as Array<{ src?: string; alt?: string; caption?: string }> | undefined;

  const showFeaturesBlock = showSection(sections, "features");
  const showArticlesRoadmapBlock =
    showSection(sections, "articles") || showSection(sections, "roadmap");
  const showVideosBlock =
    Boolean(showSection(sections, "videos") && (detail.videos as VideoEntry[] | undefined)?.length);
  const showTestimonialsBlock = showSection(sections, "testimonials");
  const showTeamBlock = showSection(sections, "team");
  const hasSectionsBetweenMissionAndContributeFeedback =
    showFeaturesBlock ||
    showArticlesRoadmapBlock ||
    showVideosBlock ||
    showTestimonialsBlock ||
    showTeamBlock;
  const linksColumnExtraBottomPadding =
    showMission &&
    !hasSectionsBetweenMissionAndContributeFeedback &&
    (showSection(sections, "contribute") || showSection(sections, "feedback"));

  return (
    <div className="landing-root project-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProjectDetailLayout>
        <ProjectDetailHero hero={detail.hero as any} project={proj} />
        {showSection(sections, "highlights") && <ProjectDetailHighlights metrics={hero?.metrics} />}
        <div className="content-shell content-shell--with-padding project-detail-body" style={{ paddingTop: 0 }}>
          {showMission && (
            <ProjectDetailMissionLinks
              mission={detail.mission as any}
              links={detail.links as any}
              linksColumnExtraBottomPadding={linksColumnExtraBottomPadding}
              screenshotsSlot={
                showShots ? (
                  <ProjectDetailScreenshots embedded screenshots={shotList} />
                ) : undefined
              }
            />
          )}
          {!showMission && showShots && <ProjectDetailScreenshots screenshots={shotList} />}
          {showSection(sections, "features") && (
            hasFeatures ? (
              <ProjectDetailFeatures features={detail.features as any} />
            ) : (
              <ProjectDetailPlaceholder sectionTitle="Features" />
            )
          )}
          {showSection(sections, "articles") || showSection(sections, "roadmap") ? (
            <div className="project-detail-articles-roadmap-row">
              {showSection(sections, "articles") && (
                <div>
                  {displayArticles?.length ? (
                    <ProjectDetailArticles articles={displayArticles as any} />
                  ) : (
                    <ProjectDetailPlaceholder sectionTitle="Articles" message="Articles tagged with this project are available on the main portal." />
                  )}
                </div>
              )}
              {showSection(sections, "roadmap") && (
                <div>
                  {detail.roadmap?.length ? (
                    <ProjectDetailRoadmap roadmap={detail.roadmap as any} roadmapPagination={detail.roadmapPagination as any} />
                  ) : (
                    <ProjectDetailPlaceholder sectionTitle="Roadmap" />
                  )}
                </div>
              )}
            </div>
          ) : null}
          {showSection(sections, "videos") && (detail.videos as VideoEntry[] | undefined)?.length && (
            <ProjectDetailVideos videos={detail.videos as VideoEntry[]} />
          )}
          {showSection(sections, "testimonials") && (
            displayTestimonials?.length ? (
              <ProjectDetailTestimonials testimonials={displayTestimonials} readMoreHref={detail.testimonialsReadMoreHref} />
            ) : (
              <ProjectDetailPlaceholder sectionTitle="Testimonials" />
            )
          )}
          {showSection(sections, "team") && (
            displayTeam?.length ? (
              <ProjectDetailTeam team={displayTeam as any} />
            ) : (
              <ProjectDetailPlaceholder sectionTitle="Team" />
            )
          )}
          {showSection(sections, "contribute") && <ProjectDetailContribute contribute={detail.contribute as any} />}
          {showSection(sections, "feedback") && (
            <ProjectDetailFeedback
              projectName={proj.name}
              feedback={
                detail.feedback as { email?: string; subjectPrefix?: string; desc?: string; descShort?: string } | undefined
              }
            />
          )}
          {showSection(sections, "partners") && (
            displayPartners?.length ? (
              <ProjectDetailPartners partners={displayPartners as any} />
            ) : (
              <ProjectDetailPlaceholder sectionTitle="Partners" />
            )
          )}
          {showSection(sections, "donate") &&
            detail.donate != null &&
            typeof detail.donate === "object" &&
            Object.keys(detail.donate as object).length > 0 && (
              <ProjectDetailDonate donate={detail.donate as any} />
            )}
        </div>
      </ProjectDetailLayout>
    </div>
  );
}

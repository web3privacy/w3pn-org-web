"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAdminToast } from "@/components/org/AdminToast";
import { orgAsset } from "@/lib/org/asset-url";
import "@/styles/org/admin.css";

type Project = {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  order?: number;
  image?: string;
  newsTag?: string;
  links?: Record<string, string>;
  hidden?: boolean;
  [k: string]: unknown;
};

type ProjectDetail = Record<string, unknown>;

type Metric = { value?: string; label?: string; sublabel?: string };
type Highlight = { src?: string; caption?: string; alt?: string };
type Screenshot = { src?: string; thumbnailSrc?: string; previewSrc?: string; alt?: string; caption?: string };
type RoadmapItem = { quarter?: string; phase?: string; title?: string; description?: string; release?: string; items?: string[]; readMoreHref?: string; completed?: boolean };
type Feature = { title?: string; subtitle?: string; description?: string; link?: string; linkLabel?: string; icon?: string; image?: string };
type Article = { title?: string; excerpt?: string; date?: string; href?: string; thumbnail?: string };
type Testimonial = { name?: string; role?: string; quote?: string; avatar?: string };
type TeamMember = { name?: string; role?: string; avatar?: string; href?: string };
type Partner = { name?: string; description?: string; logo?: string; href?: string };
type ContributeLink = { label?: string; href?: string; icon?: string };
type VideoEntry = { youtubeId: string; title?: string; speaker?: string; role?: string };

const CATEGORIES = ["main", "research", "tools", "community", "other"];

const PROJECT_DISPLAY_SECTIONS = [
  { id: "highlights", label: "Highlights (metrics)" },
  { id: "missionLinks", label: "Mission & Links" },
  { id: "screenshots", label: "Screenshots" },
  { id: "features", label: "Features" },
  { id: "articles", label: "Articles" },
  { id: "videos", label: "Videos" },
  { id: "roadmap", label: "Roadmap" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contribute", label: "Contribute" },
  { id: "feedback", label: "Feedback" },
  { id: "team", label: "Team" },
  { id: "partners", label: "Partners" },
] as const;

const SECTIONS = [
  { id: "display", label: "Display" },
  { id: "visibility", label: "Section visibility" },
  { id: "hero", label: "Hero & Metrics" },
  { id: "missionHighlights", label: "Mission highlights" },
  { id: "screenshots", label: "Screenshots (main grid)" },
  { id: "links", label: "Links" },
  { id: "mission", label: "Mission" },
  { id: "features", label: "Features" },
  { id: "articles", label: "Articles" },
  { id: "videos", label: "Videos" },
  { id: "roadmap", label: "Roadmap" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contribute", label: "Contribute" },
  { id: "feedback", label: "Feedback" },
  { id: "team", label: "Team" },
  { id: "partners", label: "Partners" },
  { id: "content", label: "JSON" },
];

type Props = {
  project: Project;
  initialDetail: ProjectDetail | null;
};

function ensureArray<T>(arr: unknown): T[] {
  return Array.isArray(arr) ? arr as T[] : [];
}

export function ProjectAdminEditor({ project, initialDetail }: Props) {
  const [proj, setProj] = useState<Project>(() => ({ ...project }));
  const [detail, setDetail] = useState<ProjectDetail | null>(() =>
    initialDetail ? JSON.parse(JSON.stringify(initialDetail)) : null
  );
  const [activeSection, setActiveSection] = useState<string>("display");
  const [loading, setLoading] = useState(false);
  const [paragraphFetchIdx, setParagraphFetchIdx] = useState<number | null>(null);
  const { addToast } = useAdminToast();

  const setProjField = useCallback(<K extends keyof Project>(key: K, value: Project[K]) => {
    setProj((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDetailField = useCallback((path: string, value: unknown) => {
    setDetail((prev) => {
      const next = prev ? JSON.parse(JSON.stringify(prev)) : {};
      const keys = path.split(".");
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in cur) || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes] = await Promise.all([
        fetch("/api/org/projects", { method: "GET", credentials: "include" }),
      ]);
      const projectsData = await projectsRes.json();
      const projects: Project[] = projectsData.projects ?? [];
      const idx = projects.findIndex((p: Project) => p.id === proj.id);
      const updatedProj = { ...proj };
      const projectsNext = [...projects];
      if (idx >= 0) {
        projectsNext[idx] = { ...projectsNext[idx], ...updatedProj };
      } else {
        projectsNext.push(updatedProj);
      }
      projectsNext.sort((a: Project, b: Project) => (a.order ?? 999) - (b.order ?? 999));

      const [putProjectsRes, putDetailsRes] = await Promise.all([
        fetch("/api/org/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ projects: projectsNext }),
        }),
        fetch(`/api/org/projects/${proj.id}/details`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(detail ?? {}),
        }),
      ]);

      if (putProjectsRes.ok && putDetailsRes.ok) {
        addToast("success", "Project saved successfully");
      } else {
        addToast("error", "Failed to save project");
      }
    } catch {
      addToast("error", "Error saving project");
    } finally {
      setLoading(false);
    }
  }, [proj, detail, addToast]);

  const d = detail as Record<string, unknown>;
  const hero = d?.hero as { title?: string; tagline?: string; ctaLabel?: string; ctaHref?: string; logo?: string; graphic?: string; backgroundImage?: string; metrics?: Metric[] } | undefined;
  const mission = d?.mission as { text?: string; readMoreHref?: string; imageUrl?: string; heading?: string } | undefined;
  const links = d?.links as Record<string, string> | undefined;
  const metrics = ensureArray<Metric>(hero?.metrics);
  const missionHighlights = ensureArray<Highlight>((mission as { highlights?: unknown })?.highlights);
  const screenshots = ensureArray<Screenshot>(d?.screenshots);
  const roadmap = ensureArray<RoadmapItem>(d?.roadmap);
  const roadmapPagination = (d?.roadmapPagination as { current?: number; total?: number }) ?? {};
  const features = Array.isArray(d?.features) ? d.features as Feature[] : (d?.features as { cards?: Feature[] })?.cards ?? (d?.features as { items?: Feature[] })?.items ?? [];
  const featuresArr = Array.isArray(features) ? features : [];
  const articles = ensureArray<Article>(d?.articles);
  const testimonials = ensureArray<Testimonial>(d?.testimonials);
  const contributeData = d?.contribute as { text?: string; textShort?: string; desktopOnly?: boolean; links?: ContributeLink[] } | undefined;
  const contributeLinks = ensureArray<ContributeLink>(contributeData?.links);
  const team = ensureArray<TeamMember>(d?.team);
  const partners = ensureArray<Partner>(d?.partners);
  const videos = ensureArray<VideoEntry>(d?.videos);
  const feedback = d?.feedback as { email?: string; subjectPrefix?: string; desc?: string; descShort?: string } | undefined;
  const sectionsConfig = (d?.sections ?? {}) as Record<string, boolean>;

  const linkKeys = ["url", "docs", "github", "website", "telegram", "twitter", "discord"];

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Project: {proj.name ?? proj.id}</h1>
        <div className="org-admin-actions">
          <Link href="/admin/projects" className="org-admin-btn org-admin-btn--secondary">← Projects</Link>
          <Link href={`/projects/${proj.id}`} className="org-admin-btn org-admin-btn--secondary" target="_blank">Preview</Link>
          <button type="button" className="org-admin-btn org-admin-btn--primary" onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="org-admin-layout">
        <nav className="org-admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`org-admin-nav-item ${activeSection === s.id ? "is-active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="org-admin-form">
          {activeSection === "display" && (
            <section className="org-admin-block">
              <h2>Display</h2>
              <div className="org-admin-row">
                <div className="org-admin-field">
                  <label>Order</label>
                  <input type="number" value={proj.order ?? ""} onChange={(e) => setProjField("order", e.target.value ? parseInt(e.target.value, 10) : undefined)} className="org-admin-input org-admin-input--tiny" />
                </div>
                <div className="org-admin-field">
                  <label>Category</label>
                  <select value={proj.category ?? ""} onChange={(e) => setProjField("category", e.target.value || undefined)} className="org-admin-input">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="org-admin-field">
                <label className="org-admin-check">
                  <input type="checkbox" checked={!!proj.hidden} onChange={(e) => setProjField("hidden", e.target.checked)} />
                  Hidden
                </label>
              </div>
              <div className="org-admin-field">
                <label>Name</label>
                <input value={proj.name ?? ""} onChange={(e) => setProjField("name", e.target.value)} className="org-admin-input org-admin-input--wide" />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <textarea value={proj.description ?? ""} onChange={(e) => setProjField("description", e.target.value)} rows={3} className="org-admin-input org-admin-input--wide" />
              </div>
              <div className="org-admin-field">
                <label>Image path</label>
                <input value={proj.image ?? ""} onChange={(e) => setProjField("image", e.target.value)} className="org-admin-input" placeholder="/projects/xxx.png" />
              </div>
            </section>
          )}

          {activeSection === "visibility" && (
            <section className="org-admin-block">
              <h2>Section visibility</h2>
              <p className="org-admin-hint">Uncheck to hide the section on the project detail page (e.g. when there are no testimonials).</p>
              <div className="org-admin-sections-visibility">
                {PROJECT_DISPLAY_SECTIONS.map((s) => (
                  <label key={s.id} className="org-admin-check org-admin-check--block">
                    <input
                      type="checkbox"
                      checked={sectionsConfig[s.id] !== false}
                      onChange={(e) => setDetailField("sections", { ...sectionsConfig, [s.id]: e.target.checked })}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeSection === "hero" && (
            <section className="org-admin-block">
              <h2>Hero & Metrics (highlight numbers)</h2>
              <div className="org-admin-field">
                <label>Title</label>
                <input value={hero?.title ?? ""} onChange={(e) => setDetailField("hero.title", e.target.value)} className="org-admin-input org-admin-input--wide" />
              </div>
              <div className="org-admin-field">
                <label>Tagline</label>
                <textarea value={hero?.tagline ?? ""} onChange={(e) => setDetailField("hero.tagline", e.target.value)} rows={2} className="org-admin-input org-admin-input--wide" />
              </div>
              <div className="org-admin-field">
                <label>CTA Label</label>
                <input value={hero?.ctaLabel ?? ""} onChange={(e) => setDetailField("hero.ctaLabel", e.target.value)} className="org-admin-input" />
              </div>
              <div className="org-admin-field">
                <label>CTA Link</label>
                <input value={hero?.ctaHref ?? ""} onChange={(e) => setDetailField("hero.ctaHref", e.target.value)} className="org-admin-input org-admin-input--wide" />
              </div>
              <h3>Metrics (value + label, e.g. 800+ PROJECTS)</h3>
              {metrics.map((m, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={m.value ?? ""} onChange={(e) => { const n = [...metrics]; n[i] = { ...n[i], value: e.target.value }; setDetailField("hero.metrics", n); }} placeholder="value" className="org-admin-input org-admin-input--tiny" />
                  <input value={m.label ?? ""} onChange={(e) => { const n = [...metrics]; n[i] = { ...n[i], label: e.target.value }; setDetailField("hero.metrics", n); }} placeholder="label" className="org-admin-input" style={{ maxWidth: 140 }} />
                  <input value={m.sublabel ?? ""} onChange={(e) => { const n = [...metrics]; n[i] = { ...n[i], sublabel: e.target.value }; setDetailField("hero.metrics", n); }} placeholder="sublabel" className="org-admin-input org-admin-input--tiny" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("hero.metrics", metrics.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("hero.metrics", [...metrics, { value: "", label: "" }])}>+ Add metric</button>
            </section>
          )}

          {activeSection === "missionHighlights" && (
            <section className="org-admin-block">
              <h2>Mission highlights</h2>
              <p className="org-admin-hint">Small images in the Mission / Links block (next to mission text). Path e.g. /images/projects/items/{proj.id}/gallery/highlight1.webp</p>
              {missionHighlights.map((h, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={h.src ?? ""} onChange={(e) => { const n = [...missionHighlights]; n[i] = { ...n[i], src: e.target.value }; setDetailField("mission.highlights", n); }} placeholder="src (path or URL)" className="org-admin-input org-admin-input--wide" />
                  <input value={h.caption ?? ""} onChange={(e) => { const n = [...missionHighlights]; n[i] = { ...n[i], caption: e.target.value }; setDetailField("mission.highlights", n); }} placeholder="caption" className="org-admin-input" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("mission.highlights", missionHighlights.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("mission.highlights", [...missionHighlights, { src: "", caption: "" }])}>+ Add highlight</button>
            </section>
          )}

          {activeSection === "screenshots" && (
            <section className="org-admin-block">
              <h2>Screenshots (main grid)</h2>
              <p className="org-admin-hint">Main screenshot grid on the project page. Path e.g. /images/projects/items/{proj.id}/gallery/screenshot1.webp. Upload images to public/images/projects/items/{proj.id}/gallery/</p>
              {screenshots.map((s, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={s.src ?? ""} onChange={(e) => { const n = [...screenshots]; n[i] = { ...n[i], src: e.target.value }; setDetailField("screenshots", n); }} placeholder="src (path or URL)" className="org-admin-input org-admin-input--wide" />
                  <input value={s.alt ?? ""} onChange={(e) => { const n = [...screenshots]; n[i] = { ...n[i], alt: e.target.value }; setDetailField("screenshots", n); }} placeholder="alt text" className="org-admin-input org-admin-input--tiny" />
                  <input value={s.caption ?? ""} onChange={(e) => { const n = [...screenshots]; n[i] = { ...n[i], caption: e.target.value }; setDetailField("screenshots", n); }} placeholder="caption" className="org-admin-input" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("screenshots", screenshots.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("screenshots", [...screenshots, { src: "", alt: "", caption: "" }])}>+ Add screenshot</button>
            </section>
          )}

          {activeSection === "links" && (
            <section className="org-admin-block">
              <h2>Links</h2>
              {linkKeys.map((key) => (
                <div key={key} className="org-admin-field">
                  <label>{key}</label>
                  <input value={links?.[key] ?? ""} onChange={(e) => setDetailField(`links.${key}`, e.target.value || undefined)} className="org-admin-input org-admin-input--wide" placeholder={`https://...`} />
                </div>
              ))}
            </section>
          )}

          {activeSection === "mission" && (
            <section className="org-admin-block">
              <h2>Mission</h2>
              <div className="org-admin-field">
                <label>Text</label>
                <textarea value={mission?.text ?? ""} onChange={(e) => setDetailField("mission.text", e.target.value)} rows={5} className="org-admin-input org-admin-input--wide" />
              </div>
              <div className="org-admin-field">
                <label>Read more link</label>
                <input value={mission?.readMoreHref ?? ""} onChange={(e) => setDetailField("mission.readMoreHref", e.target.value)} className="org-admin-input org-admin-input--wide" />
              </div>
            </section>
          )}

          {activeSection === "features" && (
            <section className="org-admin-block">
              <h2>Features</h2>
              <p className="org-admin-hint">Up to 8 cards. Icon: Material Design name (dashboard, docs, code, github, community, api, data, link, metrics, integration, school, book, telegram, video). If left empty, a matching fallback icon is picked from the text.</p>
              {featuresArr.map((f, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={(f as Feature).icon ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).icon = e.target.value; setDetailField("features", n); }} placeholder="icon (e.g. dashboard, docs, code)" className="org-admin-input org-admin-input--tiny" />
                  <input value={(f as Feature).image ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).image = e.target.value; setDetailField("features", n); }} placeholder="image (path or URL)" className="org-admin-input org-admin-input--wide" />
                  <input value={(f as Feature).title ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).title = e.target.value; setDetailField("features", n); }} placeholder="title" className="org-admin-input" />
                  <input value={(f as Feature).subtitle ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).subtitle = e.target.value; setDetailField("features", n); }} placeholder="subtitle" className="org-admin-input org-admin-input--tiny" />
                  <input value={(f as Feature).description ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).description = e.target.value; setDetailField("features", n); }} placeholder="description" className="org-admin-input org-admin-input--wide" />
                  <input value={(f as Feature).link ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).link = e.target.value; setDetailField("features", n); }} placeholder="link" className="org-admin-input" />
                  <input value={(f as Feature).linkLabel ?? ""} onChange={(e) => { const n = [...featuresArr]; (n[i] as Feature).linkLabel = e.target.value; setDetailField("features", n); }} placeholder="linkLabel" className="org-admin-input org-admin-input--tiny" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("features", featuresArr.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("features", [...featuresArr, { title: "", description: "", link: "", linkLabel: "Learn more" }])} disabled={featuresArr.length >= 8}>+ Add feature (max 8)</button>
            </section>
          )}

          {activeSection === "articles" && (
            <section className="org-admin-block">
              <h2>Articles</h2>
              <p className="org-admin-hint">
                Thumbnail: paste a path under <code>/org/...</code> or a full image URL. For Paragraph posts, use
                &quot;Fetch cover from Paragraph&quot; (saves to <code>/org/article-covers/</code> when the server can
                write to disk; on Vercel preview you get the direct image URL instead). Regenerate all covers locally:{" "}
                <code>npm run paragraph:fetch-covers</code>.
              </p>
              <div className="org-admin-field">
                <label>Link to all articles</label>
                <input value={(d?.articlesHrefAll as string) ?? ""} onChange={(e) => setDetailField("articlesHrefAll", e.target.value || undefined)} className="org-admin-input org-admin-input--wide" placeholder="https://..." />
              </div>
              {articles.map((a, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
                  {a.thumbnail && (
                    <img
                      src={orgAsset(a.thumbnail) || a.thumbnail}
                      alt=""
                      style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)" }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input value={a.title ?? ""} onChange={(e) => { const n = [...articles]; n[i] = { ...n[i], title: e.target.value }; setDetailField("articles", n); }} placeholder="title" className="org-admin-input org-admin-input--wide" />
                    <input value={a.date ?? ""} onChange={(e) => { const n = [...articles]; n[i] = { ...n[i], date: e.target.value }; setDetailField("articles", n); }} placeholder="date (2024-01-15)" className="org-admin-input org-admin-input--tiny" />
                    <input value={a.href ?? ""} onChange={(e) => { const n = [...articles]; n[i] = { ...n[i], href: e.target.value }; setDetailField("articles", n); }} placeholder="href" className="org-admin-input org-admin-input--wide" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <input value={a.thumbnail ?? ""} onChange={(e) => { const n = [...articles]; n[i] = { ...n[i], thumbnail: e.target.value }; setDetailField("articles", n); }} placeholder="thumbnail URL or /org/article-covers/..." className="org-admin-input org-admin-input--wide" style={{ flex: 1, minWidth: 200 }} />
                      {/\bparagraph\.com\b/i.test(a.href ?? "") && (
                        <button
                          type="button"
                          className="org-admin-btn org-admin-btn--secondary org-admin-btn--small"
                          disabled={paragraphFetchIdx === i}
                          onClick={async () => {
                            const href = (a.href ?? "").trim();
                            if (!href) return;
                            setParagraphFetchIdx(i);
                            try {
                              const res = await fetch("/api/org/fetch-paragraph-cover", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ href }),
                              });
                              const data = (await res.json().catch(() => ({}))) as { thumbnail?: string; error?: string; source?: string };
                              if (!res.ok) {
                                addToast("error", data.error || `Fetch failed (${res.status})`);
                                return;
                              }
                              if (data.thumbnail) {
                                const n = [...articles];
                                n[i] = { ...n[i], thumbnail: data.thumbnail };
                                setDetailField("articles", n);
                                addToast("success", data.source === "remote" ? "Cover URL set (remote — save YAML from dev to persist file)" : "Cover saved under /org/article-covers/");
                              }
                            } catch (e) {
                              addToast("error", e instanceof Error ? e.message : "Request failed");
                            } finally {
                              setParagraphFetchIdx(null);
                            }
                          }}
                        >
                          {paragraphFetchIdx === i ? "Fetching…" : "Fetch cover from Paragraph"}
                        </button>
                      )}
                    </div>
                    <textarea value={a.excerpt ?? ""} onChange={(e) => { const n = [...articles]; n[i] = { ...n[i], excerpt: e.target.value }; setDetailField("articles", n); }} placeholder="excerpt" rows={2} className="org-admin-input org-admin-input--wide" />
                  </div>
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("articles", articles.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("articles", [...articles, { title: "", date: "", href: "" }])}>+ Add article</button>
            </section>
          )}

          {activeSection === "videos" && (
            <section className="org-admin-block">
              <h2>Videos</h2>
              <p className="org-admin-hint">{videos.length} video(s). Each video has a YouTube ID, title, speaker, and role. Paste a YouTube ID or full URL — the ID will be extracted automatically.</p>
              {videos.map((v, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
                  {v.youtubeId && (
                    <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                      <img
                        src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                        alt=""
                        style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </a>
                  )}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
                    <input value={v.youtubeId ?? ""} onChange={(e) => { let val = e.target.value.trim(); const m = val.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); if (m) val = m[1]; const n = [...videos]; n[i] = { ...n[i], youtubeId: val }; setDetailField("videos", n); }} placeholder="YouTube ID or URL" className="org-admin-input" />
                    <input value={v.title ?? ""} onChange={(e) => { const n = [...videos]; n[i] = { ...n[i], title: e.target.value }; setDetailField("videos", n); }} placeholder="Title" className="org-admin-input org-admin-input--wide" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={v.speaker ?? ""} onChange={(e) => { const n = [...videos]; n[i] = { ...n[i], speaker: e.target.value }; setDetailField("videos", n); }} placeholder="Speaker" className="org-admin-input" style={{ flex: 1 }} />
                      <input value={v.role ?? ""} onChange={(e) => { const n = [...videos]; n[i] = { ...n[i], role: e.target.value }; setDetailField("videos", n); }} placeholder="Role / Org" className="org-admin-input" style={{ flex: 1 }} />
                    </div>
                  </div>
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("videos", videos.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("videos", [...videos, { youtubeId: "", title: "", speaker: "", role: "" }])}>+ Add video</button>
            </section>
          )}

          {activeSection === "roadmap" && (
            <section className="org-admin-block">
              <h2>Roadmap</h2>
              <p className="org-admin-hint">For each item check “Past (done)” – it appears at the bottom of the timeline with green style. Unchecked = future (top, light style). Timeline order: future from nearest first, past from oldest – use ↑↓ buttons to reorder.</p>
              <div className="org-admin-row" style={{ marginBottom: 12 }}>
                <div className="org-admin-field">
                  <label>Pagination: current</label>
                  <input type="number" min={1} value={roadmapPagination.current ?? ""} onChange={(e) => setDetailField("roadmapPagination", { ...roadmapPagination, current: e.target.value ? parseInt(e.target.value, 10) : undefined })} className="org-admin-input org-admin-input--tiny" placeholder="1" />
                </div>
                <div className="org-admin-field">
                  <label>total</label>
                  <input type="number" min={1} value={roadmapPagination.total ?? ""} onChange={(e) => setDetailField("roadmapPagination", { ...roadmapPagination, total: e.target.value ? parseInt(e.target.value, 10) : undefined })} className="org-admin-input org-admin-input--tiny" placeholder="1" />
                </div>
              </div>
              {roadmap.map((r, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested" style={{ borderLeft: r.completed ? "3px solid #70ff88" : "3px solid rgba(255,255,255,0.3)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <label className="org-admin-check" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={!!r.completed} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], completed: e.target.checked }; setDetailField("roadmap", n); }} />
                      <strong>{r.completed ? "Past (done)" : "Future (upcoming)"}</strong>
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" className="org-admin-btn org-admin-btn--small" disabled={i === 0} onClick={() => { const n = [...roadmap]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setDetailField("roadmap", n); }}>↑</button>
                      <button type="button" className="org-admin-btn org-admin-btn--small" disabled={i === roadmap.length - 1} onClick={() => { const n = [...roadmap]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setDetailField("roadmap", n); }}>↓</button>
                    </div>
                  </div>
                  <input value={r.quarter ?? ""} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], quarter: e.target.value }; setDetailField("roadmap", n); }} placeholder="Quarter (Q1 2026)" className="org-admin-input org-admin-input--tiny" />
                  <input value={r.phase ?? ""} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], phase: e.target.value }; setDetailField("roadmap", n); }} placeholder="Phase (optional)" className="org-admin-input org-admin-input--tiny" />
                  <input value={r.title ?? ""} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], title: e.target.value }; setDetailField("roadmap", n); }} placeholder="Title" className="org-admin-input org-admin-input--wide" />
                  <textarea value={r.description ?? ""} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], description: e.target.value }; setDetailField("roadmap", n); }} placeholder="Description" rows={2} className="org-admin-input org-admin-input--wide" />
                  <input value={r.readMoreHref ?? ""} onChange={(e) => { const n = [...roadmap]; n[i] = { ...n[i], readMoreHref: e.target.value }; setDetailField("roadmap", n); }} placeholder="readMoreHref" className="org-admin-input" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("roadmap", roadmap.filter((_, j) => j !== i))}>− Remove</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("roadmap", [...roadmap, { quarter: "", title: "", description: "", completed: false }])}>+ Add milestone</button>
            </section>
          )}

          {activeSection === "testimonials" && (
            <section className="org-admin-block">
              <h2>Testimonials</h2>
              <div className="org-admin-field">
                <label>Read more link</label>
                <input value={(d?.testimonialsReadMoreHref as string) ?? ""} onChange={(e) => setDetailField("testimonialsReadMoreHref", e.target.value || undefined)} className="org-admin-input org-admin-input--wide" />
              </div>
              {testimonials.map((t, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={t.name ?? ""} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], name: e.target.value }; setDetailField("testimonials", n); }} placeholder="name" className="org-admin-input" />
                  <input value={t.role ?? ""} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], role: e.target.value }; setDetailField("testimonials", n); }} placeholder="role" className="org-admin-input" />
                  <input value={t.avatar ?? ""} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], avatar: e.target.value }; setDetailField("testimonials", n); }} placeholder="avatar path" className="org-admin-input" />
                  <textarea value={t.quote ?? ""} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], quote: e.target.value }; setDetailField("testimonials", n); }} placeholder="quote" rows={2} className="org-admin-input org-admin-input--wide" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("testimonials", testimonials.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("testimonials", [...testimonials, { name: "", role: "", quote: "" }])}>+ Add testimonial</button>
            </section>
          )}

          {activeSection === "contribute" && (
            <section className="org-admin-block">
              <h2>Contribute</h2>
              <p className="org-admin-hint">
                “How to contribute” on the project page: full text (desktop), optional short text for tablet/mobile (≤1024px), and links. Without short text, the full paragraph is limited to about two lines on smaller viewports.
              </p>
              <div className="org-admin-field org-admin-field--inline">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(contributeData?.desktopOnly)}
                    onChange={(e) => setDetailField("contribute.desktopOnly", e.target.checked ? true : false)}
                  />{" "}
                  Contribute: desktop only (hide on tablet &amp; mobile, ≤1024px)
                </label>
              </div>
              <div className="org-admin-field">
                <label>Text (desktop)</label>
                <textarea value={contributeData?.text ?? ""} onChange={(e) => setDetailField("contribute.text", e.target.value)} rows={3} className="org-admin-input org-admin-input--wide" placeholder="Contribute talks, courses, or guides…" />
              </div>
              <div className="org-admin-field">
                <label>Short text (tablet &amp; mobile, optional)</label>
                <textarea value={contributeData?.textShort ?? ""} onChange={(e) => setDetailField("contribute.textShort", e.target.value || undefined)} rows={2} className="org-admin-input org-admin-input--wide" placeholder="~2 lines; shown below 1025px width when set" />
              </div>
              <h3>Links (How to)</h3>
              {contributeLinks.map((link, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={link.label ?? ""} onChange={(e) => { const n = [...contributeLinks]; n[i] = { ...n[i], label: e.target.value }; setDetailField("contribute.links", n); }} placeholder="label (Code, Docs…)" className="org-admin-input" />
                  <input value={link.href ?? ""} onChange={(e) => { const n = [...contributeLinks]; n[i] = { ...n[i], href: e.target.value }; setDetailField("contribute.links", n); }} placeholder="href" className="org-admin-input org-admin-input--wide" />
                  <input value={link.icon ?? ""} onChange={(e) => { const n = [...contributeLinks]; n[i] = { ...n[i], icon: e.target.value }; setDetailField("contribute.links", n); }} placeholder="icon (optional)" className="org-admin-input org-admin-input--tiny" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("contribute.links", contributeLinks.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("contribute.links", [...contributeLinks, { label: "", href: "" }])}>+ Add link</button>
            </section>
          )}

          {activeSection === "feedback" && (
            <section className="org-admin-block">
              <h2>Feedback template</h2>
              <p className="org-admin-hint">
                Subject prefix is added to the mailto subject. Intro text: full paragraph on desktop (≥1025px); shorter copy on tablet and mobile (≤1024px)—leave blank to use site defaults.
              </p>
              <div className="org-admin-field">
                <label>Feedback e-mail</label>
                <input value={feedback?.email ?? ""} onChange={(e) => setDetailField("feedback.email", e.target.value || undefined)} className="org-admin-input org-admin-input--wide" placeholder="web3privacynow@protonmail.com" />
              </div>
              <div className="org-admin-field">
                <label>Subject prefix (e.g. &quot;Feedback [Privacy Explorer]&quot; – project name is added automatically)</label>
                <input value={feedback?.subjectPrefix ?? ""} onChange={(e) => setDetailField("feedback.subjectPrefix", e.target.value || undefined)} className="org-admin-input org-admin-input--wide" placeholder={`Feedback [${proj.name ?? proj.id}]`} />
              </div>
              <div className="org-admin-field">
                <label>Intro text (desktop)</label>
                <textarea value={feedback?.desc ?? ""} onChange={(e) => setDetailField("feedback.desc", e.target.value || undefined)} rows={4} className="org-admin-input org-admin-input--wide" placeholder="Optional; default is the long org-wide feedback blurb" />
              </div>
              <div className="org-admin-field">
                <label>Intro text short (tablet &amp; mobile)</label>
                <textarea value={feedback?.descShort ?? ""} onChange={(e) => setDetailField("feedback.descShort", e.target.value || undefined)} rows={2} className="org-admin-input org-admin-input--wide" placeholder="Optional; default is ~2 lines" />
              </div>
            </section>
          )}

          {activeSection === "team" && (
            <section className="org-admin-block">
              <h2>Team</h2>
              <p className="org-admin-hint">
                Members render on the project page when <strong>Team</strong> is checked under <strong>Section visibility</strong>. Avatar: path under <code>public/</code> or absolute image URL.
              </p>
              {team.map((t, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={t.name ?? ""} onChange={(e) => { const n = [...team]; n[i] = { ...n[i], name: e.target.value }; setDetailField("team", n); }} placeholder="name" className="org-admin-input" />
                  <input value={t.role ?? ""} onChange={(e) => { const n = [...team]; n[i] = { ...n[i], role: e.target.value }; setDetailField("team", n); }} placeholder="role" className="org-admin-input" />
                  <input value={t.avatar ?? ""} onChange={(e) => { const n = [...team]; n[i] = { ...n[i], avatar: e.target.value }; setDetailField("team", n); }} placeholder="avatar path or URL" className="org-admin-input org-admin-input--wide" />
                  <input value={t.href ?? ""} onChange={(e) => { const n = [...team]; n[i] = { ...n[i], href: e.target.value || undefined }; setDetailField("team", n); }} placeholder="GitHub / profile link (optional)" className="org-admin-input org-admin-input--wide" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("team", team.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("team", [...team, { name: "", role: "" }])}>+ Add member</button>
            </section>
          )}

          {activeSection === "partners" && (
            <section className="org-admin-block">
              <h2>Partners</h2>
              <p className="org-admin-hint">Project partners – logo, name, description, link. When empty, the placeholder from the main admin is shown.</p>
              {partners.map((p, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input value={p.name ?? ""} onChange={(e) => { const n = [...partners]; n[i] = { ...n[i], name: e.target.value }; setDetailField("partners", n); }} placeholder="Name" className="org-admin-input" />
                  <input value={p.logo ?? ""} onChange={(e) => { const n = [...partners]; n[i] = { ...n[i], logo: e.target.value }; setDetailField("partners", n); }} placeholder="Logo path" className="org-admin-input" />
                  <input value={p.description ?? ""} onChange={(e) => { const n = [...partners]; n[i] = { ...n[i], description: e.target.value }; setDetailField("partners", n); }} placeholder="Description" className="org-admin-input" />
                  <input value={p.href ?? ""} onChange={(e) => { const n = [...partners]; n[i] = { ...n[i], href: e.target.value }; setDetailField("partners", n); }} placeholder="Link URL" className="org-admin-input org-admin-input--wide" />
                  <button type="button" className="org-admin-btn org-admin-btn--danger org-admin-btn--small" onClick={() => setDetailField("partners", partners.filter((_, j) => j !== i))}>−</button>
                </div>
              ))}
              <button type="button" className="org-admin-btn org-admin-btn--secondary org-admin-btn--small" onClick={() => setDetailField("partners", [...partners, { name: "", logo: "", description: "", href: "" }])}>+ Add partner</button>
            </section>
          )}

          {activeSection === "content" && (
            <section className="org-admin-block">
              <h2>Full detail (JSON)</h2>
              <p className="org-admin-hint">Full detail editing as JSON.</p>
              <textarea
                value={JSON.stringify(detail, null, 2)}
                onChange={(e) => { try { setDetail(JSON.parse(e.target.value)); } catch { /* ignore */ } }}
                rows={20}
                className="org-admin-input org-admin-input--wide"
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

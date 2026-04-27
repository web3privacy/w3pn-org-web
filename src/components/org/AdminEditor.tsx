"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSetOrgPreviewContent, type Content } from "@/lib/org/OrgContentContext";
import AdminFileUpload from "@/components/org/AdminFileUpload";
import { useAdminToast } from "@/components/org/AdminToast";
import "@/styles/org/admin.css";

function cloneContent(c: Content): Content {
  return JSON.parse(JSON.stringify(c));
}

type NavItem = { label: string; href: string; external?: boolean };
type SocialItem = { label: string; icon?: string; href: string; visible?: boolean };
type PartnerLogo = { name: string; image: string };
type IntroSupporter = { name: string; role: string; type?: string; statValue?: string; image?: string };
type ImpactStat = { label: string; value: string };
type ActivityCard = { title: string; text: string; logo: string; image?: string; linkText: string; linkHref: string };
type ActivityCategory = { title: string; titleImage?: string; cards: ActivityCard[] };
type AcademyCard = { videoId?: string; image: string; title: string; meta?: string; link: string };
type TestimonialItem = {
  name: string;
  role: string;
  image: string;
  quote: string;
  priority?: number;
  /** 1-based column on wide layout; omit for automatic shortest-column placement. */
  masonryColumn?: number;
  /** Order within a column (lower = closer to top). */
  masonryOrder?: number;
};
type EventsPageHero = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  galleryImages?: string[];
  eyeImageUrl?: string;
  backgroundImage?: string;
};

type ProjectsPageHero = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  backgroundImage?: string;
};

export default function AdminEditor({ initialContent }: { initialContent: Content }) {
  const [content, setContent] = useState<Content>(() => cloneContent(initialContent));
  const setPreview = useSetOrgPreviewContent();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("menu");
  const { addToast } = useAdminToast();

  const update = useCallback(<K extends keyof Content>(key: K, value: Content[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const persistToServer = useCallback(async () => {
    const res = await fetch("/api/org/default-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ merge: content }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || `Save failed (${res.status})`);
    }
  }, [content]);

  const saveOnly = useCallback(async () => {
    try {
      await persistToServer();
      setPreview(content);
      addToast("success", "Homepage saved to website");
      router.refresh();
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistToServer]);

  const saveAndPreview = useCallback(async () => {
    try {
      await persistToServer();
      setPreview(content);
      addToast("success", "Homepage saved to website");
      router.refresh();
      window.open("/", "_blank");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistToServer]);

  const site = (content.site ?? {}) as { ctaText?: string; ctaLink?: string };
  const nav = (content.nav ?? { items: [] }) as { items: NavItem[] };
  const hero = (content.hero ?? {}) as {
    title?: string;
    backgroundImage?: string;
    overlayImage?: string | null;
    social?: SocialItem[];
  };
  const partners = (content.partners ?? {}) as { logos?: PartnerLogo[]; marqueeImage?: string };
  const intro = (content.intro ?? {}) as {
    heading?: string;
    videoThumbnail?: string;
    videoTitle?: string;
    videoLink?: string;
    supporters?: IntroSupporter[];
  };
  const impact = (content.impact ?? {}) as {
    title?: string;
    description?: string;
    sectionImage?: string;
    stats?: ImpactStat[];
  };
  const activities = (content.activities ?? { categories: [] }) as {
    categories?: ActivityCategory[];
    ctaText?: string;
    ctaLink?: string;
  };
  const academy = (content.academy ?? {}) as {
    title?: string;
    backgroundImage?: string;
    showBackground?: boolean;
    cards?: AcademyCard[];
  };
  const ecosystem = (content.ecosystem ?? {}) as {
    title?: string;
    subtitle?: string;
    diagramImage?: string;
  };
  const testimonials = (content.testimonials ?? {}) as {
    title?: string;
    items?: TestimonialItem[];
  };
  const eventsPage = (content.eventsPage ?? {}) as Record<string, unknown>;
  const eventsPageHero = ((eventsPage.hero ?? {}) as EventsPageHero) ?? {};
  const projectsPage = (content.projectsPage ?? {}) as Record<string, unknown>;
  const projectsPageHero = ((projectsPage.hero ?? {}) as ProjectsPageHero) ?? {};

  const projectDetailPlaceholders = (content.projectDetailPlaceholders ?? {}) as {
    partners?: Array<{ name?: string; logo?: string; href?: string; description?: string }>;
    articles?: unknown[];
  };

  const sections = [
    { id: "menu", label: "Menu" },
    { id: "hero", label: "Hero" },
    { id: "events-page-hero", label: "Events page hero" },
    { id: "projects-page-hero", label: "Projects page hero" },
    { id: "partners", label: "Partners strip" },
    { id: "project-detail-partners", label: "Project detail – Partners (placeholder)" },
    { id: "ecosystem-intro", label: "Ecosystem (Intro)" },
    { id: "impact", label: "Worldwide Impact" },
    { id: "video", label: "Video section" },
    { id: "privacy-ecosystem", label: "Privacy as Ecosystem" },
    { id: "testimonials", label: "Testimonials" },
  ] as const;

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Homepage</h1>
        <div className="org-admin-actions">
          <Link href="/" className="org-admin-btn org-admin-btn--secondary" target="_blank">
            View Page
          </Link>
          <button type="button" className="org-admin-btn org-admin-btn--secondary" onClick={saveOnly}>
            Save
          </button>
          <button type="button" className="org-admin-btn org-admin-btn--primary" onClick={saveAndPreview}>
            Save &amp; view site
          </button>
        </div>
      </div>

      <div className="org-admin-layout">
        <nav className="org-admin-nav">
          {sections.map((s) => (
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
          {activeSection === "menu" && (
            <section className="org-admin-block">
              <h2>Menu items</h2>
              <p className="org-admin-hint">Edit label and link. Use label &quot;//&quot; for separator.</p>
              {(nav.items ?? []).map((item, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Label</label>
                      <input
                        value={item.label}
                        onChange={(e) => {
                          const next = [...(nav.items ?? [])];
                          next[i] = { ...next[i], label: e.target.value };
                          update("nav", { ...nav, items: next });
                        }}
                        placeholder="Label"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Link</label>
                      <input
                        value={item.href ?? ""}
                        onChange={(e) => {
                          const next = [...(nav.items ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          update("nav", { ...nav, items: next });
                        }}
                        placeholder="/path or https://..."
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <label className="org-admin-check">
                      <input
                        type="checkbox"
                        checked={!!item.external}
                        onChange={(e) => {
                          const next = [...(nav.items ?? [])];
                          next[i] = { ...next[i], external: e.target.checked };
                          update("nav", { ...nav, items: next });
                        }}
                      />
                      External
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() => update("nav", { ...nav, items: [...(nav.items ?? []), { label: "", href: "#" }] })}
              >
                + Add item
              </button>
            </section>
          )}

          {activeSection === "hero" && (
            <section className="org-admin-block">
              <h2>Hero section</h2>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <div className="org-admin-upload-row">
                  <input
                    value={hero.backgroundImage ?? ""}
                    onChange={(e) => update("hero", { ...hero, backgroundImage: e.target.value })}
                    placeholder="/images/site-shared/misc/assets/hero-bg.webp"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <AdminFileUpload
                    folder="hero"
                    label="Upload image"
                    onUploaded={(url) => update("hero", { ...hero, backgroundImage: url })}
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label>Overlay image URL (optional)</label>
                <input
                  value={hero.overlayImage ?? ""}
                  onChange={(e) => update("hero", { ...hero, overlayImage: e.target.value || null })}
                  placeholder="Leave empty for gradient overlay"
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Hero title</label>
                <textarea
                  value={hero.title ?? ""}
                  onChange={(e) => update("hero", { ...hero, title: e.target.value })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>CTA button text</label>
                <input
                  value={site.ctaText ?? ""}
                  onChange={(e) => update("site", { ...(content.site ?? {}), ctaText: e.target.value })}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>CTA button link</label>
                <input
                  value={site.ctaLink ?? ""}
                  onChange={(e) => update("site", { ...(content.site ?? {}), ctaLink: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Social links</h3>
              <p className="org-admin-hint">Icon: twitter, telegram, youtube, bluesky, github, linkedin, instagram. Add/remove items.</p>
              {(hero.social ?? []).map((s, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Icon</label>
                      <input
                        value={s.icon ?? ""}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], icon: e.target.value };
                          update("hero", { ...hero, social: next });
                        }}
                        placeholder="twitter, telegram, youtube..."
                        className="org-admin-input"
                        title="twitter, telegram, youtube, bluesky, github, linkedin, instagram"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={s.label}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], label: e.target.value };
                          update("hero", { ...hero, social: next });
                        }}
                        placeholder="Display name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>URL</label>
                      <input
                        value={s.href}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          update("hero", { ...hero, social: next });
                        }}
                        placeholder="https://..."
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <label className="org-admin-check">
                      <input
                        type="checkbox"
                        checked={s.visible !== false}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], visible: e.target.checked };
                          update("hero", { ...hero, social: next });
                        }}
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("hero", {
                          ...hero,
                          social: (hero.social ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("hero", {
                    ...hero,
                    social: [...(hero.social ?? []), { label: "", icon: "twitter", href: "https://", visible: true }],
                  })
                }
              >
                + Add social link
              </button>
            </section>
          )}

          {activeSection === "partners" && (
            <section className="org-admin-block">
              <h2>Partners strip – logos</h2>
              <p className="org-admin-hint">Add/remove logos in the hero marquee.</p>
              {(partners.logos ?? []).map((logo, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={logo.name}
                        onChange={(e) => {
                          const next = [...(partners.logos ?? [])];
                          next[i] = { ...next[i], name: e.target.value };
                          update("partners", { ...partners, logos: next });
                        }}
                        placeholder="Partner name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Image URL</label>
                      <input
                        value={logo.image}
                        onChange={(e) => {
                          const next = [...(partners.logos ?? [])];
                          next[i] = { ...next[i], image: e.target.value };
                          update("partners", { ...partners, logos: next });
                        }}
                        placeholder="/images/..."
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("partners", {
                          ...partners,
                          logos: (partners.logos ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("partners", {
                    ...partners,
                    logos: [...(partners.logos ?? []), { name: "", image: "" }],
                  })
                }
              >
                + Add logo
              </button>
            </section>
          )}

          {activeSection === "events-page-hero" && (
            <section className="org-admin-block">
              <h2>Events page hero</h2>
              <p className="org-admin-hint">
                Controls hero content used on <code>/events</code> page.
              </p>
              <div className="org-admin-field">
                <label>Title</label>
                <textarea
                  value={eventsPageHero.title ?? ""}
                  onChange={(e) =>
                    update("eventsPage", {
                      ...eventsPage,
                      hero: { ...eventsPageHero, title: e.target.value },
                    })
                  }
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <textarea
                  value={eventsPageHero.description ?? ""}
                  onChange={(e) =>
                    update("eventsPage", {
                      ...eventsPage,
                      hero: { ...eventsPageHero, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-row">
                <div className="org-admin-field">
                  <label>CTA label</label>
                  <input
                    value={eventsPageHero.ctaLabel ?? ""}
                    onChange={(e) =>
                      update("eventsPage", {
                        ...eventsPage,
                        hero: { ...eventsPageHero, ctaLabel: e.target.value },
                      })
                    }
                    className="org-admin-input"
                  />
                </div>
                <div className="org-admin-field">
                  <label>CTA href</label>
                  <input
                    value={eventsPageHero.ctaHref ?? ""}
                    onChange={(e) =>
                      update("eventsPage", {
                        ...eventsPage,
                        hero: { ...eventsPageHero, ctaHref: e.target.value },
                      })
                    }
                    className="org-admin-input org-admin-input--wide"
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <input
                  value={eventsPageHero.backgroundImage ?? ""}
                  onChange={(e) =>
                    update("eventsPage", {
                      ...eventsPage,
                      hero: { ...eventsPageHero, backgroundImage: e.target.value },
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Eye image URL</label>
                <input
                  value={eventsPageHero.eyeImageUrl ?? ""}
                  onChange={(e) =>
                    update("eventsPage", {
                      ...eventsPage,
                      hero: { ...eventsPageHero, eyeImageUrl: e.target.value },
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>

              <h3>Gallery images</h3>
              {((eventsPageHero.galleryImages ?? []) as string[]).map((imageUrl, i) => (
                <div key={`${imageUrl}-${i}`} className="org-admin-card">
                  <div className="org-admin-field">
                    <label>Image URL</label>
                    <input
                      value={imageUrl}
                      onChange={(e) => {
                        const next = [...(eventsPageHero.galleryImages ?? [])];
                        next[i] = e.target.value;
                        update("eventsPage", {
                          ...eventsPage,
                          hero: { ...eventsPageHero, galleryImages: next },
                        });
                      }}
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() => {
                        const next = (eventsPageHero.galleryImages ?? []).filter((_, j) => j !== i);
                        update("eventsPage", {
                          ...eventsPage,
                          hero: { ...eventsPageHero, galleryImages: next },
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("eventsPage", {
                    ...eventsPage,
                    hero: { ...eventsPageHero, galleryImages: [...(eventsPageHero.galleryImages ?? []), ""] },
                  })
                }
              >
                + Add gallery image
              </button>
            </section>
          )}

          {activeSection === "projects-page-hero" && (
            <section className="org-admin-block">
              <h2>Projects page hero</h2>
              <p className="org-admin-hint">
                Controls hero content used on the <code>/projects</code> listing page.
              </p>
              <div className="org-admin-field">
                <label>Title</label>
                <p className="org-admin-hint">Use a line break in the text for a second line in the headline.</p>
                <textarea
                  value={projectsPageHero.title ?? ""}
                  onChange={(e) =>
                    update("projectsPage", {
                      ...projectsPage,
                      hero: { ...projectsPageHero, title: e.target.value },
                    })
                  }
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <p className="org-admin-hint">Separate paragraphs with a blank line.</p>
                <textarea
                  value={projectsPageHero.description ?? ""}
                  onChange={(e) =>
                    update("projectsPage", {
                      ...projectsPage,
                      hero: { ...projectsPageHero, description: e.target.value },
                    })
                  }
                  rows={4}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-row">
                <div className="org-admin-field">
                  <label>CTA label</label>
                  <input
                    value={projectsPageHero.ctaLabel ?? ""}
                    onChange={(e) =>
                      update("projectsPage", {
                        ...projectsPage,
                        hero: { ...projectsPageHero, ctaLabel: e.target.value },
                      })
                    }
                    className="org-admin-input"
                  />
                </div>
                <div className="org-admin-field">
                  <label>CTA href</label>
                  <input
                    value={projectsPageHero.ctaHref ?? ""}
                    onChange={(e) =>
                      update("projectsPage", {
                        ...projectsPage,
                        hero: { ...projectsPageHero, ctaHref: e.target.value },
                      })
                    }
                    className="org-admin-input org-admin-input--wide"
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <div className="org-admin-upload-row">
                  <input
                    value={projectsPageHero.backgroundImage ?? ""}
                    onChange={(e) =>
                      update("projectsPage", {
                        ...projectsPage,
                        hero: { ...projectsPageHero, backgroundImage: e.target.value },
                      })
                    }
                    placeholder="/images/projects/page/assets/bg-projects.jpg"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <AdminFileUpload
                    folder="projects"
                    label="Upload image"
                    onUploaded={(url) =>
                      update("projectsPage", {
                        ...projectsPage,
                        hero: { ...projectsPageHero, backgroundImage: url },
                      })
                    }
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === "project-detail-partners" && (
            <section className="org-admin-block">
              <h2>Project detail – Partners (placeholder)</h2>
              <p className="org-admin-hint">Shown on project pages that don’t have their own partners. Can be overridden in each project’s admin.</p>
              {(projectDetailPlaceholders.partners ?? []).map((p, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={p.name ?? ""}
                        onChange={(e) => {
                          const next = [...(projectDetailPlaceholders.partners ?? [])];
                          next[i] = { ...next[i], name: e.target.value };
                          update("projectDetailPlaceholders", { ...projectDetailPlaceholders, partners: next });
                        }}
                        placeholder="Partner name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Description</label>
                      <input
                        value={p.description ?? ""}
                        onChange={(e) => {
                          const next = [...(projectDetailPlaceholders.partners ?? [])];
                          next[i] = { ...next[i], description: e.target.value };
                          update("projectDetailPlaceholders", { ...projectDetailPlaceholders, partners: next });
                        }}
                        placeholder="e.g. Grant Partner"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Logo URL</label>
                      <input
                        value={p.logo ?? ""}
                        onChange={(e) => {
                          const next = [...(projectDetailPlaceholders.partners ?? [])];
                          next[i] = { ...next[i], logo: e.target.value };
                          update("projectDetailPlaceholders", { ...projectDetailPlaceholders, partners: next });
                        }}
                        placeholder="/images/site-shared/navigation/header-logo.svg"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Link URL</label>
                      <input
                        value={p.href ?? ""}
                        onChange={(e) => {
                          const next = [...(projectDetailPlaceholders.partners ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          update("projectDetailPlaceholders", { ...projectDetailPlaceholders, partners: next });
                        }}
                        placeholder="https://..."
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("projectDetailPlaceholders", {
                          ...projectDetailPlaceholders,
                          partners: (projectDetailPlaceholders.partners ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--secondary org-admin-btn--small"
                onClick={() =>
                  update("projectDetailPlaceholders", {
                    ...projectDetailPlaceholders,
                    partners: [...(projectDetailPlaceholders.partners ?? []), { name: "", logo: "", description: "", href: "" }],
                  })
                }
              >
                + Add partner
              </button>
            </section>
          )}

          {activeSection === "ecosystem-intro" && (
            <section className="org-admin-block">
              <h2>Ecosystem / Intro</h2>
              <div className="org-admin-field">
                <label>Heading</label>
                <textarea
                  value={intro.heading ?? ""}
                  onChange={(e) => update("intro", { ...intro, heading: e.target.value })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Video thumbnail image URL</label>
                <input
                  value={intro.videoThumbnail ?? ""}
                  onChange={(e) => update("intro", { ...intro, videoThumbnail: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Video title</label>
                <input
                  value={intro.videoTitle ?? ""}
                  onChange={(e) => update("intro", { ...intro, videoTitle: e.target.value })}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>Video link (optional – makes thumbnail clickable)</label>
                <input
                  value={(intro as { videoLink?: string }).videoLink ?? ""}
                  onChange={(e) => update("intro", { ...intro, videoLink: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                  placeholder="https://..."
                />
              </div>
              <h3>Avatars &amp; stat (&quot;80+&quot;)</h3>
              {(intro.supporters ?? []).map((person, i) => (
                <div key={i} className="org-admin-card">
                  <label className="org-admin-check">
                    <input
                      type="checkbox"
                      checked={person.type === "stat"}
                      onChange={(e) => {
                        const next = [...(intro.supporters ?? [])];
                        next[i] = {
                          ...next[i],
                          type: e.target.checked ? "stat" : undefined,
                          statValue: e.target.checked ? next[i].statValue ?? "80+" : undefined,
                        };
                        update("intro", { ...intro, supporters: next });
                      }}
                    />
                    Is stat circle
                  </label>
                  {person.type === "stat" ? (
                    <div className="org-admin-field">
                      <label>Stat Value</label>
                      <input
                        value={person.statValue ?? ""}
                        onChange={(e) => {
                          const next = [...(intro.supporters ?? [])];
                          next[i] = { ...next[i], statValue: e.target.value };
                          update("intro", { ...intro, supporters: next });
                        }}
                        placeholder="e.g. 80+"
                        className="org-admin-input org-admin-input--md"
                      />
                    </div>
                  ) : (
                    <div className="org-admin-field-grid">
                      <div className="org-admin-field">
                        <label>Name</label>
                        <input
                          value={person.name}
                          onChange={(e) => {
                            const next = [...(intro.supporters ?? [])];
                            next[i] = { ...next[i], name: e.target.value };
                            update("intro", { ...intro, supporters: next });
                          }}
                          placeholder="Name"
                          className="org-admin-input"
                        />
                      </div>
                      <div className="org-admin-field">
                        <label>Role</label>
                        <input
                          value={person.role}
                          onChange={(e) => {
                            const next = [...(intro.supporters ?? [])];
                            next[i] = { ...next[i], role: e.target.value };
                            update("intro", { ...intro, supporters: next });
                          }}
                          placeholder="Role"
                          className="org-admin-input"
                        />
                      </div>
                      <div className="org-admin-field org-admin-field--full">
                        <label>Image URL</label>
                        <input
                          value={person.image ?? ""}
                          onChange={(e) => {
                            const next = [...(intro.supporters ?? [])];
                            next[i] = { ...next[i], image: e.target.value };
                            update("intro", { ...intro, supporters: next });
                          }}
                          placeholder="/images/site-shared/misc/assets/profile-person.webp"
                          className="org-admin-input"
                        />
                      </div>
                    </div>
                  )}
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("intro", {
                          ...intro,
                          supporters: (intro.supporters ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("intro", {
                    ...intro,
                    supporters: [...(intro.supporters ?? []), { name: "", role: "", image: "" }],
                  })
                }
              >
                + Add person
              </button>
            </section>
          )}

          {activeSection === "impact" && (
            <section className="org-admin-block">
              <h2>Worldwide Impact</h2>
              <div className="org-admin-field">
                <label>Section background image</label>
                <input
                  value={impact.sectionImage ?? ""}
                  onChange={(e) => update("impact", { ...impact, sectionImage: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={impact.title ?? ""}
                  onChange={(e) => update("impact", { ...impact, title: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <textarea
                  value={impact.description ?? ""}
                  onChange={(e) => update("impact", { ...impact, description: e.target.value })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Stats (numbers)</h3>
              {(impact.stats ?? []).map((stat, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Label</label>
                      <input
                        value={stat.label}
                        onChange={(e) => {
                          const next = [...(impact.stats ?? [])];
                          next[i] = { ...next[i], label: e.target.value };
                          update("impact", { ...impact, stats: next });
                        }}
                        placeholder="e.g. Events organized"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Value</label>
                      <input
                        value={stat.value}
                        onChange={(e) => {
                          const next = [...(impact.stats ?? [])];
                          next[i] = { ...next[i], value: e.target.value };
                          update("impact", { ...impact, stats: next });
                        }}
                        placeholder="e.g. 50+"
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("impact", {
                          ...impact,
                          stats: (impact.stats ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("impact", {
                    ...impact,
                    stats: [...(impact.stats ?? []), { label: "", value: "" }],
                  })
                }
              >
                + Add stat
              </button>
              <h3>Projects by track (4 tracks)</h3>
              {(activities.categories ?? []).map((cat, catIndex) => (
                <div key={catIndex} className="org-admin-card org-admin-card--nested">
                  <h4>Track: {cat.title}</h4>
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Track title</label>
                      <input
                        value={cat.title}
                        onChange={(e) => {
                          const next = [...(activities.categories ?? [])];
                          next[catIndex] = { ...next[catIndex], title: e.target.value };
                          update("activities", { ...activities, categories: next });
                        }}
                        placeholder="Track title"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Title image URL</label>
                      <input
                        value={cat.titleImage ?? ""}
                        onChange={(e) => {
                          const next = [...(activities.categories ?? [])];
                          next[catIndex] = { ...next[catIndex], titleImage: e.target.value };
                          update("activities", { ...activities, categories: next });
                        }}
                        placeholder="/images/projects/page/assets/title-tools.png"
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  {cat.cards.map((card, cardIndex) => (
                    <div key={cardIndex} className="org-admin-subblock">
                      <div className="org-admin-field-grid">
                        <div className="org-admin-field">
                          <label>Title</label>
                          <input
                            value={card.title}
                            onChange={(e) => {
                              const next = [...(activities.categories ?? [])];
                              const cards = [...next[catIndex].cards];
                              cards[cardIndex] = { ...cards[cardIndex], title: e.target.value };
                              next[catIndex] = { ...next[catIndex], cards };
                              update("activities", { ...activities, categories: next });
                            }}
                            placeholder="Project title"
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-field">
                          <label>Logo URL</label>
                          <input
                            value={card.logo}
                            onChange={(e) => {
                              const next = [...(activities.categories ?? [])];
                              const cards = [...next[catIndex].cards];
                              cards[cardIndex] = { ...cards[cardIndex], logo: e.target.value };
                              next[catIndex] = { ...next[catIndex], cards };
                              update("activities", { ...activities, categories: next });
                            }}
                            placeholder="/images/projects/items/privacy-portal/icon/project-privacy-portal.webp"
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-field org-admin-field--full">
                          <label>Description</label>
                          <input
                            value={card.text}
                            onChange={(e) => {
                              const next = [...(activities.categories ?? [])];
                              const cards = [...next[catIndex].cards];
                              cards[cardIndex] = { ...cards[cardIndex], text: e.target.value };
                              next[catIndex] = { ...next[catIndex], cards };
                              update("activities", { ...activities, categories: next });
                            }}
                            placeholder="Description"
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-field">
                          <label>Link text</label>
                          <input
                            value={card.linkText}
                            onChange={(e) => {
                              const next = [...(activities.categories ?? [])];
                              const cards = [...next[catIndex].cards];
                              cards[cardIndex] = { ...cards[cardIndex], linkText: e.target.value };
                              next[catIndex] = { ...next[catIndex], cards };
                              update("activities", { ...activities, categories: next });
                            }}
                            placeholder="Link text"
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-field">
                          <label>Link URL</label>
                          <input
                            value={card.linkHref}
                            onChange={(e) => {
                              const next = [...(activities.categories ?? [])];
                              const cards = [...next[catIndex].cards];
                              cards[cardIndex] = { ...cards[cardIndex], linkHref: e.target.value };
                              next[catIndex] = { ...next[catIndex], cards };
                              update("activities", { ...activities, categories: next });
                            }}
                            placeholder="https://..."
                            className="org-admin-input"
                          />
                        </div>
                      </div>
                      <div className="org-admin-card-actions">
                        <button
                          type="button"
                          className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                          onClick={() => {
                            const next = [...(activities.categories ?? [])];
                            const cards = next[catIndex].cards.filter((_, j) => j !== cardIndex);
                            next[catIndex] = { ...next[catIndex], cards };
                            update("activities", { ...activities, categories: next });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small"
                    onClick={() => {
                      const next = [...(activities.categories ?? [])];
                      const cards = [...next[catIndex].cards, { title: "", text: "", logo: "", linkText: "", linkHref: "" }];
                      next[catIndex] = { ...next[catIndex], cards };
                      update("activities", { ...activities, categories: next });
                    }}
                  >
                    + Add project to track
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeSection === "video" && (
            <section className="org-admin-block">
              <h2>Video section (Academy)</h2>
              <div className="org-admin-field">
                <label>Headline</label>
                <textarea
                  value={academy.title ?? ""}
                  onChange={(e) => update("academy", { ...academy, title: e.target.value })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <div className="org-admin-upload-row">
                  <input
                    value={academy.backgroundImage ?? ""}
                    onChange={(e) => update("academy", { ...academy, backgroundImage: e.target.value })}
                    placeholder="/images/home/sections/academy/assets/academy-bg.png"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <AdminFileUpload
                    folder="hero"
                    label="Upload image"
                    onUploaded={(url) => update("academy", { ...academy, backgroundImage: url })}
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label className="org-admin-checkbox-row">
                  <input
                    type="checkbox"
                    checked={academy.showBackground !== false}
                    onChange={(e) => update("academy", { ...academy, showBackground: e.target.checked })}
                  />
                  <span>Show background image</span>
                </label>
              </div>
              <h3>Videos (link + embed)</h3>
              {(academy.cards ?? []).map((card, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Title</label>
                      <input
                        value={card.title}
                        onChange={(e) => {
                          const next = [...(academy.cards ?? [])];
                          next[i] = { ...next[i], title: e.target.value };
                          update("academy", { ...academy, cards: next });
                        }}
                        placeholder="Video title"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>YouTube video ID</label>
                      <input
                        value={card.videoId ?? ""}
                        onChange={(e) => {
                          const next = [...(academy.cards ?? [])];
                          next[i] = { ...next[i], videoId: e.target.value };
                          update("academy", { ...academy, cards: next });
                        }}
                        placeholder="e.g. dQw4w9WgXcQ"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Video link</label>
                      <input
                        value={card.link ?? ""}
                        onChange={(e) => {
                          const next = [...(academy.cards ?? [])];
                          next[i] = { ...next[i], link: e.target.value };
                          update("academy", { ...academy, cards: next });
                        }}
                        placeholder="https://youtube.com/..."
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Thumbnail image URL</label>
                      <input
                        value={card.image}
                        onChange={(e) => {
                          const next = [...(academy.cards ?? [])];
                          next[i] = { ...next[i], image: e.target.value };
                          update("academy", { ...academy, cards: next });
                        }}
                        placeholder="/images/home/sections/academy/assets/academy-bg-videos.webp"
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("academy", { ...academy, cards: (academy.cards ?? []).filter((_, j) => j !== i) })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("academy", {
                    ...academy,
                    cards: [...(academy.cards ?? []), { title: "", image: "", link: "", videoId: "" }],
                  })
                }
              >
                + Add video
              </button>
            </section>
          )}

          {activeSection === "privacy-ecosystem" && (
            <section className="org-admin-block">
              <h2>Privacy as Ecosystem</h2>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={ecosystem.title ?? ""}
                  onChange={(e) => update("ecosystem", { ...ecosystem, title: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description / subtitle</label>
                <textarea
                  value={ecosystem.subtitle ?? ""}
                  onChange={(e) => update("ecosystem", { ...ecosystem, subtitle: e.target.value })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Diagram image URL</label>
                <input
                  value={ecosystem.diagramImage ?? ""}
                  onChange={(e) => update("ecosystem", { ...ecosystem, diagramImage: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
            </section>
          )}

          {activeSection === "testimonials" && (
            <section className="org-admin-block">
              <h2>Testimonials</h2>
              <div className="org-admin-field">
                <label>Section title</label>
                <input
                  value={testimonials.title ?? ""}
                  onChange={(e) => update("testimonials", { ...testimonials, title: e.target.value })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <p className="org-admin-hint">
                Priority sets default order (used on single-column layouts and for auto-placed cards). Optional
                masonry column (1–3) pins a card to that vertical stack; masonry order sorts cards in the same
                column (lower = higher). Leave column empty for automatic balancing across columns.
              </p>
              {(testimonials.items ?? []).map((item, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          next[i] = { ...next[i], name: e.target.value };
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="Full name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Role</label>
                      <input
                        value={item.role}
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          next[i] = { ...next[i], role: e.target.value };
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="Job title / org"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Image URL</label>
                      <input
                        value={item.image}
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          next[i] = { ...next[i], image: e.target.value };
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="/images/site-shared/misc/assets/profile-person.webp"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Priority</label>
                      <input
                        value={item.priority ?? i + 1}
                        type="number"
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          next[i] = { ...next[i], priority: parseInt(e.target.value, 10) || 0 };
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="#"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Masonry column</label>
                      <input
                        value={item.masonryColumn != null ? String(item.masonryColumn) : ""}
                        type="number"
                        min={1}
                        max={6}
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          const raw = e.target.value.trim();
                          if (raw === "") {
                            const { masonryColumn: _c, masonryOrder: _o, ...rest } = next[i]!;
                            next[i] = rest as TestimonialItem;
                          } else {
                            const n = parseInt(raw, 10);
                            next[i] = {
                              ...next[i]!,
                              masonryColumn: Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : undefined,
                            };
                          }
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="auto"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Masonry order</label>
                      <input
                        value={item.masonryOrder != null ? String(item.masonryOrder) : ""}
                        type="number"
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          const raw = e.target.value.trim();
                          if (raw === "") {
                            const { masonryOrder: _o, ...rest } = next[i]!;
                            next[i] = rest as TestimonialItem;
                          } else {
                            const n = parseInt(raw, 10);
                            next[i] = {
                              ...next[i]!,
                              masonryOrder: Number.isFinite(n) ? n : undefined,
                            };
                          }
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="0"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Quote</label>
                      <textarea
                        value={item.quote}
                        onChange={(e) => {
                          const next = [...(testimonials.items ?? [])];
                          next[i] = { ...next[i], quote: e.target.value };
                          update("testimonials", { ...testimonials, items: next });
                        }}
                        placeholder="Testimonial quote text"
                        rows={2}
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        update("testimonials", {
                          ...testimonials,
                          items: (testimonials.items ?? []).filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  update("testimonials", {
                    ...testimonials,
                    items: [
                      ...(testimonials.items ?? []),
                      { name: "", role: "", image: "", quote: "", priority: (testimonials.items ?? []).length + 1 },
                    ],
                  })
                }
              >
                + Add testimonial
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

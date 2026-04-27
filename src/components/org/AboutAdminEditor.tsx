"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ORG_ADMIN_PREVIEW_KEY,
  useSetOrgPreviewContent,
  type Content,
} from "@/lib/org/OrgContentContext";
import AdminFileUpload from "@/components/org/AdminFileUpload";
import { useAdminToast } from "@/components/org/AdminToast";
import "@/styles/org/admin.css";

function cloneContent(c: Content): Content {
  return JSON.parse(JSON.stringify(c));
}

type AboutHero = { title?: string; backgroundImage?: string; social?: { label: string; icon?: string; href: string; visible?: boolean }[] };
type AboutMission = { title?: string; paragraphs?: string[]; imageUrl?: string; videoUrl?: string; ctaLabel?: string; ctaHref?: string };
type TimelineEvent = { year?: string; quarter?: string; time?: string; title?: string; description?: string; href?: string };
type AboutStory = { title?: string; subtitle?: string; body?: string; timeline?: TimelineEvent[]; ctaLabel?: string; ctaHref?: string; ctaMoreLabel?: string; ctaMoreHref?: string };
type AboutActivism = { title?: string; body?: string; values?: { title: string; body: string }[]; ctaButtons?: { label: string; href: string; visible?: boolean }[] };
type AboutWorkItem = { title?: string; subtitle?: string; description?: string; image?: string; logo?: string; highlights?: string[]; backgroundColor?: string; ctaLabel?: string; ctaHref?: string };
type AboutGalleryImage = string | { thumbnailUrl?: string; fullSizeUrl?: string; caption?: string };
type AboutGallery = { title?: string; images?: AboutGalleryImage[] };
type AboutTeam = { title?: string; subtitle?: string; videoUrl?: string; videoThumbnail?: string; members?: { name: string; role: string; image: string; href?: string }[]; statsSentence?: string; ctaLabel?: string; ctaHref?: string };
type AboutAmbassador = { name: string; role: string; image: string; href?: string };
type AboutFAQ = { title?: string; items?: { question: string; answer: string }[] };

const ABOUT_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "mission", label: "Mission" },
  { id: "roadmap", label: "Roadmap" },
  { id: "activism", label: "Activism" },
  { id: "values", label: "Values" },
  { id: "work", label: "Our Work" },
  { id: "gallery", label: "Gallery" },
  { id: "team", label: "Who is W3PN" },
  { id: "advisors", label: "Advisors" },
  { id: "faq", label: "FAQ" },
] as const;

export default function AboutAdminEditor({ initialContent }: { initialContent: Content }) {
  const [content, setContent] = useState<Content>(() => {
    if (typeof window === "undefined") return cloneContent(initialContent);
    try {
      const raw = window.localStorage.getItem(ORG_ADMIN_PREVIEW_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Content;
        return { ...cloneContent(initialContent), about: stored.about ?? (initialContent as Content).about };
      }
    } catch {}
    return cloneContent(initialContent);
  });
  const setPreview = useSetOrgPreviewContent();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const { addToast } = useAdminToast();

  const about = (content.about ?? {}) as Record<string, unknown>;
  const setAbout = useCallback(
    (next: Record<string, unknown>) => {
      setContent((prev) => ({ ...prev, about: next }));
    },
    []
  );

  const persistAbout = useCallback(async () => {
    const aboutPayload = (content.about ?? {}) as Record<string, unknown>;
    const res = await fetch("/api/org/default-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ merge: { about: aboutPayload } }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || `Save failed (${res.status})`);
    }
  }, [content.about]);

  const saveAndPreview = useCallback(async () => {
    try {
      await persistAbout();
      setPreview(content);
      addToast("success", "About page saved to website");
      router.refresh();
      window.open("/about", "_blank");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistAbout]);

  const saveOnly = useCallback(async () => {
    try {
      await persistAbout();
      setPreview(content);
      addToast("success", "About page saved to website");
      router.refresh();
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistAbout]);

  const hero = (about.hero ?? {}) as AboutHero;
  const mission = (about.mission ?? {}) as AboutMission;
  const story = (about.story ?? {}) as AboutStory;
  const activism = (about.activism ?? {}) as AboutActivism;
  const work = (about.work ?? {}) as { title?: string; items?: AboutWorkItem[] };
  const gallery = (about.gallery ?? {}) as AboutGallery;
  const team = (about.team ?? {}) as AboutTeam;
  const ambassadors = (about.ambassadors ?? {}) as { title?: string; members?: AboutAmbassador[] };
  const faq = (about.faq ?? {}) as AboutFAQ;

  const galleryImages = (gallery.images ?? []).map((image) =>
    typeof image === "string"
      ? { thumbnailUrl: image, fullSizeUrl: image, caption: "" }
      : {
          thumbnailUrl: image.thumbnailUrl ?? image.fullSizeUrl ?? "",
          fullSizeUrl: image.fullSizeUrl ?? image.thumbnailUrl ?? "",
          caption: image.caption ?? "",
        }
  );

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>About Us</h1>
        <div className="org-admin-actions">
          <Link href="/about" className="org-admin-btn org-admin-btn--secondary" target="_blank">
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
          {ABOUT_SECTIONS.map((s) => (
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
          {activeSection === "hero" && (
            <section className="org-admin-block">
              <h2>Hero</h2>
              <div className="org-admin-field">
                <label>Hero text (title)</label>
                <textarea
                  value={hero.title ?? ""}
                  onChange={(e) => setAbout({ ...about, hero: { ...hero, title: e.target.value } })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <input
                  value={hero.backgroundImage ?? ""}
                  onChange={(e) => setAbout({ ...about, hero: { ...hero, backgroundImage: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Social links (turn on/off + edit)</h3>
              {(hero.social ?? []).map((s, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Label</label>
                      <input
                        value={s.label}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], label: e.target.value };
                          setAbout({ ...about, hero: { ...hero, social: next } });
                        }}
                        placeholder="Display name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>URL</label>
                      <input
                        value={s.href}
                        onChange={(e) => {
                          const next = [...(hero.social ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          setAbout({ ...about, hero: { ...hero, social: next } });
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
                          setAbout({ ...about, hero: { ...hero, social: next } });
                        }}
                      />
                      Visible
                    </label>
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === "mission" && (
            <section className="org-admin-block">
              <h2>Mission</h2>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={mission.title ?? ""}
                  onChange={(e) => setAbout({ ...about, mission: { ...mission, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Paragraphs (one per line)</label>
                <textarea
                  value={(mission.paragraphs ?? []).join("\n")}
                  onChange={(e) =>
                    setAbout({
                      ...about,
                      mission: { ...mission, paragraphs: e.target.value.split("\n").filter(Boolean) },
                    })
                  }
                  rows={4}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Button text</label>
                <input
                  value={mission.ctaLabel ?? ""}
                  onChange={(e) => setAbout({ ...about, mission: { ...mission, ctaLabel: e.target.value } })}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>Button link</label>
                <input
                  value={mission.ctaHref ?? ""}
                  onChange={(e) => setAbout({ ...about, mission: { ...mission, ctaHref: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Video link</label>
                <input
                  value={mission.videoUrl ?? ""}
                  onChange={(e) => setAbout({ ...about, mission: { ...mission, videoUrl: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </section>
          )}

          {activeSection === "roadmap" && (
            <section className="org-admin-block">
              <h2>Roadmap (timeline events)</h2>
              <p className="org-admin-hint">Event = Date (year/quarter), Name, Description, Time frame (optional text), Link.</p>
              {(story.timeline ?? []).map((ev, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Year</label>
                      <input
                        value={ev.year ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], year: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
                        }}
                        placeholder="2024"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Quarter</label>
                      <input
                        value={ev.quarter ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], quarter: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
                        }}
                        placeholder="Q1, Q2..."
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Time frame</label>
                      <input
                        value={ev.time ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], time: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
                        }}
                        placeholder="Optional"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Event name</label>
                      <input
                        value={ev.title ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], title: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
                        }}
                        placeholder="Event name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Description</label>
                      <textarea
                        value={ev.description ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], description: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
                        }}
                        placeholder="Description"
                        rows={2}
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Link URL</label>
                      <input
                        value={ev.href ?? ""}
                        onChange={(e) => {
                          const next = [...(story.timeline ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          setAbout({ ...about, story: { ...story, timeline: next } });
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
                        setAbout({
                          ...about,
                          story: { ...story, timeline: (story.timeline ?? []).filter((_, j) => j !== i) },
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
                  setAbout({
                    ...about,
                    story: {
                      ...story,
                      timeline: [...(story.timeline ?? []), { year: "", quarter: "", title: "", description: "" }],
                    },
                  })
                }
              >
                + Add event
              </button>
            </section>
          )}

          {activeSection === "activism" && (
            <section className="org-admin-block">
              <h2>Activism</h2>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={activism.title ?? ""}
                  onChange={(e) => setAbout({ ...about, activism: { ...activism, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Text</label>
                <textarea
                  value={activism.body ?? ""}
                  onChange={(e) => setAbout({ ...about, activism: { ...activism, body: e.target.value } })}
                  rows={3}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Buttons (on/off, text + link)</h3>
              {(activism.ctaButtons ?? []).map((btn, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Button text</label>
                      <input
                        value={btn.label}
                        onChange={(e) => {
                          const next = [...(activism.ctaButtons ?? [])];
                          next[i] = { ...next[i], label: e.target.value };
                          setAbout({ ...about, activism: { ...activism, ctaButtons: next } });
                        }}
                        placeholder="Button text"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>URL</label>
                      <input
                        value={btn.href}
                        onChange={(e) => {
                          const next = [...(activism.ctaButtons ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          setAbout({ ...about, activism: { ...activism, ctaButtons: next } });
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
                        checked={btn.visible !== false}
                        onChange={(e) => {
                          const next = [...(activism.ctaButtons ?? [])];
                          next[i] = { ...next[i], visible: e.target.checked };
                          setAbout({ ...about, activism: { ...activism, ctaButtons: next } });
                        }}
                      />
                      Visible
                    </label>
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === "values" && (
            <section className="org-admin-block">
              <h2>Values (principles cards)</h2>
              <p className="org-admin-hint">Add/remove and edit value cards below the activism section.</p>
              {(() => {
                const defaultThree = [
                  { title: "ACT AS A NON-PROFIT", body: "Embrace open-source culture and be flexible with our direction" },
                  { title: "CHANNEL FUNDS DIRECTLY", body: "To researchers, devs and facilitators committed to advancing privacy" },
                  { title: "MAKE IMPACT ACCESSIBLE", body: "Tools, resources, reports, courses and events will be free forever" },
                ];
                const valuesList = (activism.values?.length ? activism.values : defaultThree) as { title: string; body: string }[];
                return (
                  <>
                    {valuesList.map((v, i) => (
                      <div key={i} className="org-admin-card">
                        <div className="org-admin-field">
                          <label>Title</label>
                          <input
                            value={v.title}
                            onChange={(e) => {
                              const next = valuesList.map((x, j) => (j === i ? { ...x, title: e.target.value } : x));
                              setAbout({ ...about, activism: { ...activism, values: next } });
                            }}
                            placeholder="Value title"
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-field">
                          <label>Description</label>
                          <textarea
                            value={v.body}
                            onChange={(e) => {
                              const next = valuesList.map((x, j) => (j === i ? { ...x, body: e.target.value } : x));
                              setAbout({ ...about, activism: { ...activism, values: next } });
                            }}
                            placeholder="Description"
                            rows={2}
                            className="org-admin-input"
                          />
                        </div>
                        <div className="org-admin-card-actions">
                          <button
                            type="button"
                            className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                            onClick={() => {
                              const arr = valuesList.filter((_, j) => j !== i);
                              setAbout({ ...about, activism: { ...activism, values: arr } });
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
                        setAbout({
                          ...about,
                          activism: { ...activism, values: [...valuesList, { title: "", body: "" }] },
                        });
                      }}
                    >
                      + Add value
                    </button>
                  </>
                );
              })()}
            </section>
          )}

          {activeSection === "work" && (
            <section className="org-admin-block">
              <h2>Our Work</h2>
              <div className="org-admin-field">
                <label>Section title</label>
                <input
                  value={work.title ?? ""}
                  onChange={(e) => setAbout({ ...about, work: { ...work, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              {(work.items ?? []).map((item, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <h4>Item: {item.title || "(no title)"}</h4>
                  <div className="org-admin-field">
                    <label>Name (title)</label>
                    <input
                      value={item.title ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], title: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <div className="org-admin-field">
                    <label>Description</label>
                    <textarea
                      value={item.description ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], description: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      rows={2}
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <div className="org-admin-field">
                    <label>Highlights (comma-separated)</label>
                    <input
                      value={(item.highlights ?? []).join(", ")}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], highlights: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <div className="org-admin-row">
                    <input
                      value={item.ctaLabel ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], ctaLabel: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      placeholder="Button text"
                      className="org-admin-input"
                    />
                    <input
                      value={item.ctaHref ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], ctaHref: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      placeholder="Link"
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <div className="org-admin-row">
                    <input
                      value={item.logo ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], logo: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      placeholder="Logo URL"
                      className="org-admin-input org-admin-input--wide"
                    />
                    <input
                      value={item.image ?? ""}
                      onChange={(e) => {
                        const next = [...(work.items ?? [])];
                        next[i] = { ...next[i], image: e.target.value };
                        setAbout({ ...about, work: { ...work, items: next } });
                      }}
                      placeholder="Background image URL"
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setAbout({ ...about, work: { ...work, items: (work.items ?? []).filter((_, j) => j !== i) } })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  setAbout({
                    ...about,
                    work: {
                      ...work,
                      items: [...(work.items ?? []), { title: "", description: "", highlights: [], ctaLabel: "", ctaHref: "", logo: "", image: "" }],
                    },
                  })
                }
              >
                + Add work item
              </button>
            </section>
          )}

          {activeSection === "gallery" && (
            <section className="org-admin-block">
              <h2>Gallery</h2>
              <div className="org-admin-field">
                <label>Section title</label>
                <input
                  value={gallery.title ?? ""}
                  onChange={(e) => setAbout({ ...about, gallery: { ...gallery, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <p className="org-admin-hint">Each item can use a smaller thumbnail for the grid and a full-size image for the overlay.</p>
              {galleryImages.map((image, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field org-admin-field--full">
                      <label>Thumbnail URL</label>
                      <input
                        value={image.thumbnailUrl}
                        onChange={(e) => {
                          const next = [...galleryImages];
                          next[i] = { ...next[i], thumbnailUrl: e.target.value };
                          setAbout({
                            ...about,
                            gallery: {
                              ...gallery,
                              images: next.map((item) => ({
                                thumbnailUrl: item.thumbnailUrl,
                                fullSizeUrl: item.fullSizeUrl,
                                caption: item.caption,
                              })),
                            },
                          });
                        }}
                        placeholder="/images/about-us/sections/about/assets/gallery/photo-1.webp"
                        className="org-admin-input org-admin-input--wide"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Full-size URL</label>
                      <div className="org-admin-upload-row">
                        <input
                          value={image.fullSizeUrl}
                          onChange={(e) => {
                            const next = [...galleryImages];
                            next[i] = { ...next[i], fullSizeUrl: e.target.value };
                            setAbout({
                              ...about,
                              gallery: {
                                ...gallery,
                                images: next.map((item) => ({
                                  thumbnailUrl: item.thumbnailUrl,
                                  fullSizeUrl: item.fullSizeUrl,
                                  caption: item.caption,
                                })),
                              },
                            });
                          }}
                          placeholder="/images/about-us/sections/about/assets/gallery/photo-1.webp"
                          className="org-admin-input org-admin-input--wide"
                        />
                        <AdminFileUpload
                          folder="gallery"
                          label="Upload image"
                          onUploadedResult={(data) => {
                            const next = [...galleryImages];
                            next[i] = {
                              ...next[i],
                              thumbnailUrl: data.thumbnailUrl ?? data.url ?? next[i].thumbnailUrl,
                              fullSizeUrl: data.url ?? next[i].fullSizeUrl,
                            };
                            setAbout({
                              ...about,
                              gallery: {
                                ...gallery,
                                images: next.map((item) => ({
                                  thumbnailUrl: item.thumbnailUrl,
                                  fullSizeUrl: item.fullSizeUrl,
                                  caption: item.caption,
                                })),
                              },
                            });
                          }}
                          onUploaded={(url) => {
                            const next = [...galleryImages];
                            next[i] = { ...next[i], fullSizeUrl: url, thumbnailUrl: next[i].thumbnailUrl || url };
                            setAbout({
                              ...about,
                              gallery: {
                                ...gallery,
                                images: next.map((item) => ({
                                  thumbnailUrl: item.thumbnailUrl,
                                  fullSizeUrl: item.fullSizeUrl,
                                  caption: item.caption,
                                })),
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Caption (optional)</label>
                      <input
                        value={image.caption}
                        onChange={(e) => {
                          const next = [...galleryImages];
                          next[i] = { ...next[i], caption: e.target.value };
                          setAbout({
                            ...about,
                            gallery: {
                              ...gallery,
                              images: next.map((item) => ({
                                thumbnailUrl: item.thumbnailUrl,
                                fullSizeUrl: item.fullSizeUrl,
                                caption: item.caption,
                              })),
                            },
                          });
                        }}
                        placeholder="Optional caption"
                        className="org-admin-input org-admin-input--wide"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        setAbout({
                          ...about,
                          gallery: {
                            ...gallery,
                            images: galleryImages.filter((_, j) => j !== i).map((item) => ({
                              thumbnailUrl: item.thumbnailUrl,
                              fullSizeUrl: item.fullSizeUrl,
                              caption: item.caption,
                            })),
                          },
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
                  setAbout({
                    ...about,
                    gallery: {
                      ...gallery,
                      images: [
                        ...galleryImages.map((item) => ({
                          thumbnailUrl: item.thumbnailUrl,
                          fullSizeUrl: item.fullSizeUrl,
                          caption: item.caption,
                        })),
                        { thumbnailUrl: "", fullSizeUrl: "", caption: "" },
                      ],
                    },
                  })
                }
              >
                + Add photo
              </button>
            </section>
          )}

          {activeSection === "team" && (
            <section className="org-admin-block">
              <h2>Who is W3PN</h2>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={team.title ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description (subtitle)</label>
                <textarea
                  value={team.subtitle ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, subtitle: e.target.value } })}
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Video link (leave empty to turn off)</label>
                <input
                  value={team.videoUrl ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, videoUrl: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="org-admin-field">
                <label>&quot;and 120+ contributors...&quot; text</label>
                <input
                  value={team.statsSentence ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, statsSentence: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Button text</label>
                <input
                  value={team.ctaLabel ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, ctaLabel: e.target.value } })}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>Button link</label>
                <input
                  value={team.ctaHref ?? ""}
                  onChange={(e) => setAbout({ ...about, team: { ...team, ctaHref: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Members (Avatar, Name, Desc/role)</h3>
              {(team.members ?? []).map((m, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={m.name}
                        onChange={(e) => {
                          const next = [...(team.members ?? [])];
                          next[i] = { ...next[i], name: e.target.value };
                          setAbout({ ...about, team: { ...team, members: next } });
                        }}
                        placeholder="Full name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Role</label>
                      <input
                        value={m.role}
                        onChange={(e) => {
                          const next = [...(team.members ?? [])];
                          next[i] = { ...next[i], role: e.target.value };
                          setAbout({ ...about, team: { ...team, members: next } });
                        }}
                        placeholder="Role / description"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Avatar URL</label>
                      <input
                        value={m.image}
                        onChange={(e) => {
                          const next = [...(team.members ?? [])];
                          next[i] = { ...next[i], image: e.target.value };
                          setAbout({ ...about, team: { ...team, members: next } });
                        }}
                        placeholder="/images/site-shared/misc/assets/profile-person.webp"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Profile link</label>
                      <input
                        value={m.href ?? ""}
                        onChange={(e) => {
                          const next = [...(team.members ?? [])];
                          next[i] = { ...next[i], href: e.target.value || undefined };
                          setAbout({ ...about, team: { ...team, members: next } });
                        }}
                        placeholder="https://x.com/..."
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        setAbout({
                          ...about,
                          team: { ...team, members: (team.members ?? []).filter((_, j) => j !== i) },
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
                  setAbout({
                    ...about,
                    team: { ...team, members: [...(team.members ?? []), { name: "", role: "", image: "", href: "" }] },
                  })
                }
              >
                + Add member
              </button>
            </section>
          )}

          {activeSection === "advisors" && (
            <section className="org-admin-block">
              <h2>Advisors</h2>
              <div className="org-admin-field">
                <label>Section title</label>
                <input
                  value={ambassadors.title ?? ""}
                  onChange={(e) =>
                    setAbout({ ...about, ambassadors: { ...ambassadors, title: e.target.value } })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <p className="org-admin-hint">Advisor = Name, Desc (role), Link, Avatar.</p>
              {(ambassadors.members ?? []).map((m, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field-grid">
                    <div className="org-admin-field">
                      <label>Name</label>
                      <input
                        value={m.name}
                        onChange={(e) => {
                          const next = [...(ambassadors.members ?? [])];
                          next[i] = { ...next[i], name: e.target.value };
                          setAbout({ ...about, ambassadors: { ...ambassadors, members: next } });
                        }}
                        placeholder="Full name"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field">
                      <label>Role</label>
                      <input
                        value={m.role}
                        onChange={(e) => {
                          const next = [...(ambassadors.members ?? [])];
                          next[i] = { ...next[i], role: e.target.value };
                          setAbout({ ...about, ambassadors: { ...ambassadors, members: next } });
                        }}
                        placeholder="Description / role"
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Link URL</label>
                      <input
                        value={m.href ?? ""}
                        onChange={(e) => {
                          const next = [...(ambassadors.members ?? [])];
                          next[i] = { ...next[i], href: e.target.value };
                          setAbout({ ...about, ambassadors: { ...ambassadors, members: next } });
                        }}
                        placeholder="https://..."
                        className="org-admin-input"
                      />
                    </div>
                    <div className="org-admin-field org-admin-field--full">
                      <label>Avatar URL</label>
                      <input
                        value={m.image}
                        onChange={(e) => {
                          const next = [...(ambassadors.members ?? [])];
                          next[i] = { ...next[i], image: e.target.value };
                          setAbout({ ...about, ambassadors: { ...ambassadors, members: next } });
                        }}
                        placeholder="/images/site-shared/misc/assets/profile-person.webp"
                        className="org-admin-input"
                      />
                    </div>
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        setAbout({
                          ...about,
                          ambassadors: { ...ambassadors, members: (ambassadors.members ?? []).filter((_, j) => j !== i) },
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
                  setAbout({
                    ...about,
                    ambassadors: {
                      ...ambassadors,
                      members: [...(ambassadors.members ?? []), { name: "", role: "", image: "", href: "" }],
                    },
                  })
                }
              >
                + Add advisor
              </button>
            </section>
          )}

          {activeSection === "faq" && (
            <section className="org-admin-block">
              <h2>FAQ</h2>
              <div className="org-admin-field">
                <label>Section title</label>
                <input
                  value={faq.title ?? ""}
                  onChange={(e) => setAbout({ ...about, faq: { ...faq, title: e.target.value } })}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <p className="org-admin-hint">Add/remove questions; edit question + answer.</p>
              {(faq.items ?? []).map((item, i) => (
                <div key={i} className="org-admin-card">
                  <div className="org-admin-field">
                    <label>Question</label>
                    <input
                      value={item.question}
                      onChange={(e) => {
                        const next = [...(faq.items ?? [])];
                        next[i] = { ...next[i], question: e.target.value };
                        setAbout({ ...about, faq: { ...faq, items: next } });
                      }}
                      placeholder="Question"
                      className="org-admin-input"
                    />
                  </div>
                  <div className="org-admin-field">
                    <label>Answer</label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const next = [...(faq.items ?? [])];
                        next[i] = { ...next[i], answer: e.target.value };
                        setAbout({ ...about, faq: { ...faq, items: next } });
                      }}
                      placeholder="Answer"
                      rows={2}
                      className="org-admin-input"
                    />
                  </div>
                  <div className="org-admin-card-actions">
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        setAbout({
                          ...about,
                          faq: { ...faq, items: (faq.items ?? []).filter((_, j) => j !== i) },
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
                  setAbout({
                    ...about,
                    faq: { ...faq, items: [...(faq.items ?? []), { question: "", answer: "" }] },
                  })
                }
              >
                + Add question
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

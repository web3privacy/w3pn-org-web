"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminToast } from "@/components/org/AdminToast";
import type { Event } from "@/types/events";
import type { EventDetail } from "@/types/event-detail";
import type { EventDetailSpeaker, EventDetailLink, EventDetailExperienceCard } from "@/types/event-detail";
import { DEFAULT_EVENT_STATS } from "@/components/events/event-detail/event-detail-hero-layout";
import type { ScheduleSlot, EventDetailStage } from "@/types/event-detail";
import { COUNTRY_NAMES } from "@/lib/org/events-constants";
import "@/styles/org/admin.css";

const EVENT_TYPES = ["congress", "summit", "meetup", "collab", "rave", "hackathon", "privacycorner", "online"] as const;
const COUNTRY_CODES = Object.keys(COUNTRY_NAMES).sort();

const EVENT_DISPLAY_SECTIONS = [
  { id: "topicsLinks", label: "Topics & Links" },
  { id: "speakers", label: "Speakers" },
  { id: "experience", label: "Experience" },
  { id: "location", label: "Location" },
  { id: "eventMap", label: "Event Map" },
  { id: "schedule", label: "Schedule" },
  { id: "gallery", label: "Gallery" },
  { id: "tickets", label: "Tickets" },
  { id: "videos", label: "Videos" },
  { id: "articles", label: "Articles" },
  { id: "faq", label: "FAQ" },
  { id: "sponsors", label: "Sponsors" },
  { id: "contributors", label: "Contributors" },
] as const;

const SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "visibility", label: "Section visibility" },
  { id: "hero", label: "Hero" },
  { id: "topics", label: "Topics" },
  { id: "links", label: "Links" },
  { id: "speakers", label: "Speakers" },
  { id: "experience", label: "Experience" },
  { id: "location", label: "Location" },
  { id: "eventMap", label: "Event Map" },
  { id: "schedule", label: "Program / Schedule" },
  { id: "gallery", label: "Gallery" },
  { id: "tickets", label: "Tickets" },
  { id: "videos", label: "Videos" },
  { id: "articles", label: "Articles" },
  { id: "faq", label: "FAQ" },
  { id: "sponsors", label: "Sponsors" },
  { id: "contributors", label: "Contributors" },
] as const;

type Props = {
  event: Event;
  initialDetail: EventDetail | null;
};

export function EventAdminEditor({ event, initialDetail }: Props) {
  const [ev, setEv] = useState<Event>(() => ({ ...event }));
  const [detail, setDetail] = useState<EventDetail | null>(() =>
    initialDetail ? { ...initialDetail } : null
  );
  const [activeSection, setActiveSection] = useState<string>("basics");
  const [loading, setLoading] = useState(false);
  const { addToast } = useAdminToast();

  const setEvField = useCallback(<K extends keyof Event>(key: K, value: Event[K]) => {
    setEv((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDetailField = useCallback(<K extends keyof EventDetail>(key: K, value: EventDetail[K]) => {
    setDetail((prev) => {
      const d = prev ?? { eventId: event.id };
      return { ...d, [key]: value };
    });
  }, [event.id]);

  const detailDraft = useMemo(
    () => detail ?? { eventId: event.id },
    [detail, event.id]
  );
  const d = detailDraft;

  const save = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, detRes] = await Promise.all([
        fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: ev.id,
            type: ev.type,
            date: ev.date,
            city: ev.city,
            country: ev.country,
            status: ev.status,
            title: ev.title,
            description: ev.description,
            place: ev.place,
            "place-address": ev["place-address"],
            coincidence: ev.coincidence,
            lead: ev.lead,
            links: ev.links,
            speakers: ev.speakers,
            premium: ev.premium,
            design: ev.design,
            helpers: ev.helpers,
          }),
        }),
        fetch(`/api/events/${ev.id}/details`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(detailDraft),
        }),
      ]);
      if (evRes.ok && detRes.ok) {
        addToast("success", "Event saved successfully");
      } else {
        addToast("error", "Failed to save event");
      }
    } catch {
      addToast("error", "Error saving event");
    } finally {
      setLoading(false);
    }
  }, [ev, detailDraft, addToast]);

  const customLinks = (detailDraft.links as { custom?: EventDetailLink[] })?.custom ?? [];
  const speakers = (detailDraft.speakers ?? []) as EventDetailSpeaker[];
  const expCards = (detailDraft.experience as { cards?: EventDetailExperienceCard[] })?.cards ?? [];
  const scheduleStages = (detailDraft.schedule as { stages?: EventDetailStage[] })?.stages ?? [];
  const scheduleItems = (detailDraft.schedule as { items?: Array<{ time: string; title: string; speaker?: string; description?: string }> })?.items ?? [];
  const galleryImages = (detailDraft.gallery as { images?: Array<{ url: string; caption?: string }> })?.images ?? [];
  const faqItems = (detailDraft.faq as { items?: Array<{ question: string; answer: string }> })?.items ?? [];
  const sponsorItems = (detailDraft.sponsors as { items?: Array<{ name: string; logo?: string; url?: string; twitter?: string }> })?.items ?? [];
  const contributorItems = (detailDraft.contributors as { items?: Array<{ name: string; role?: string; avatar?: string }> })?.items ?? [];
  const statsItems = (detailDraft as { stats?: Array<{ value: string; label: string }> }).stats ?? [];
  const youtubeIds = (detailDraft.videos as { youtubeIds?: string[] })?.youtubeIds ?? [];
  const articleIds = (detailDraft.articles as { articleIds?: string[] })?.articleIds ?? [];
  const sectionsConfig = (detailDraft.sections ?? {}) as Record<string, boolean>;

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Event: {ev.title ?? ev.id}</h1>
        <div className="org-admin-actions">
          <Link href={`/events/${ev.id}`} className="org-admin-btn org-admin-btn--secondary" target="_blank">
            View Page
          </Link>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--primary"
            onClick={save}
            disabled={loading}
          >
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
          {activeSection === "basics" && (
            <section className="org-admin-block">
              <h2>Basics (index.yaml)</h2>
              <div className="org-admin-field">
                <label>Type</label>
                <select
                  value={ev.type}
                  onChange={(e) => setEvField("type", e.target.value as Event["type"])}
                  className="org-admin-input"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="org-admin-row">
                <div className="org-admin-field">
                  <label>Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => setEvField("date", e.target.value)}
                    className="org-admin-input"
                  />
                </div>
                <div className="org-admin-field">
                  <label>City</label>
                  <input
                    value={ev.city}
                    onChange={(e) => setEvField("city", e.target.value)}
                    className="org-admin-input"
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label>Country</label>
                <select
                  value={ev.country}
                  onChange={(e) => setEvField("country", e.target.value)}
                  className="org-admin-input"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>
                  ))}
                </select>
              </div>
              <div className="org-admin-field">
                <label>Title (optional)</label>
                <input
                  value={ev.title ?? ""}
                  onChange={(e) => setEvField("title", e.target.value || undefined)}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <textarea
                  value={ev.description ?? ""}
                  onChange={(e) => setEvField("description", e.target.value || undefined)}
                  rows={3}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Place (Markdown link)</label>
                <input
                  value={ev.place ?? ""}
                  onChange={(e) => setEvField("place", e.target.value || undefined)}
                  placeholder="[Venue](url)"
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Place address</label>
                <input
                  value={ev["place-address"] ?? ""}
                  onChange={(e) => setEvField("place-address", e.target.value || undefined)}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Coincidence</label>
                <input
                  value={ev.coincidence ?? ""}
                  onChange={(e) => setEvField("coincidence", e.target.value || undefined)}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Lead</label>
                <input
                  value={ev.lead ?? ""}
                  onChange={(e) => setEvField("lead", e.target.value || undefined)}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>Status</label>
                <select
                  value={ev.status ?? ""}
                  onChange={(e) => setEvField("status", (e.target.value || undefined) as Event["status"])}
                  className="org-admin-input"
                >
                  <option value="">— (auto)</option>
                  <option value="upcoming">upcoming</option>
                  <option value="past">past</option>
                </select>
              </div>
              <div className="org-admin-row">
                <div className="org-admin-field">
                  <label>RSVP URL</label>
                  <input
                    type="url"
                    value={ev.links?.rsvp ?? ""}
                    onChange={(e) => setEvField("links", { ...ev.links, rsvp: e.target.value || undefined })}
                    className="org-admin-input org-admin-input--wide"
                  />
                </div>
                <div className="org-admin-field">
                  <label>Web URL</label>
                  <input
                    type="url"
                    value={ev.links?.web ?? ""}
                    onChange={(e) => setEvField("links", { ...ev.links, web: e.target.value || undefined })}
                    className="org-admin-input org-admin-input--wide"
                  />
                </div>
              </div>
              <div className="org-admin-field">
                <label>Speakers (read-only summary from index.yaml — edit via Speakers tab)</label>
                <input
                  value={(ev.speakers ?? []).map((s) => typeof s === "string" ? s : (s as { name?: string }).name ?? "").filter(Boolean).join(", ")}
                  readOnly
                  className="org-admin-input org-admin-input--wide"
                  style={{ opacity: 0.7 }}
                />
              </div>
              <div className="org-admin-field">
                <label className="org-admin-check">
                  <input
                    type="checkbox"
                    checked={!!ev.premium}
                    onChange={(e) => setEvField("premium", e.target.checked)}
                  />
                  Premium card
                </label>
              </div>
              {ev.premium && (
                <div className="org-admin-field">
                  <label>Design image URL</label>
                  <input
                    value={ev.design?.image ?? ""}
                    onChange={(e) =>
                      setEvField("design", { ...ev.design, image: e.target.value || undefined })
                    }
                    className="org-admin-input org-admin-input--wide"
                  />
                </div>
              )}
            </section>
          )}

          {activeSection === "visibility" && (
            <section className="org-admin-block">
              <h2>Section visibility</h2>
              <p className="org-admin-hint">
                Uncheck to hide the section on the event detail page.
              </p>
              <div className="org-admin-sections-visibility">
                {EVENT_DISPLAY_SECTIONS.map((s) => (
                  <label key={s.id} className="org-admin-check org-admin-check--block">
                    <input
                      type="checkbox"
                      checked={sectionsConfig[s.id] !== false}
                      onChange={(e) =>
                        setDetailField("sections", {
                          ...sectionsConfig,
                          [s.id]: e.target.checked,
                        } as EventDetail["sections"])
                      }
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeSection === "hero" && (
            <section className="org-admin-block">
              <h2>Hero</h2>
              <div className="org-admin-field">
                <label>Header image URL (empty = /images/events/items/{ev.id}/header/{ev.id}.webp)</label>
                <input
                  value={(d as { headerImageUrl?: string }).headerImageUrl ?? ""}
                  onChange={(e) => setDetailField("headerImageUrl", e.target.value || undefined)}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Hero background / cover URL (empty = same blurred image as header)</label>
                <input
                  value={(d as { heroBackgroundImageUrl?: string }).heroBackgroundImageUrl ?? ""}
                  onChange={(e) => setDetailField("heroBackgroundImageUrl", e.target.value || undefined)}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Time range (e.g. 14:00 - 22:00)</label>
                <input
                  value={d.timeRange ?? ""}
                  onChange={(e) => setDetailField("timeRange", e.target.value || undefined)}
                  className="org-admin-input"
                />
              </div>
              <div className="org-admin-field">
                <label>Short description</label>
                <textarea
                  value={(d as { shortDescription?: string }).shortDescription ?? ""}
                  onChange={(e) =>
                    setDetailField("shortDescription", e.target.value || undefined)
                  }
                  rows={2}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Highlights (one per line – e.g. 300+ VISITORS)</label>
                <textarea
                  value={((d as { highlights?: string[] }).highlights ?? []).join("\n")}
                  onChange={(e) =>
                    setDetailField(
                      "highlights",
                      e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  rows={3}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Stats (value + label – white pills, e.g. 300+ EVENT VISITORS)</label>
                <p className="org-admin-hint">When filled, this is shown instead of highlights.</p>
                {statsItems.length === 0 && (
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--secondary org-admin-btn--small mb-2"
                    onClick={() => setDetailField("stats", [...DEFAULT_EVENT_STATS])}
                  >
                    Use defaults (300+ EVENT VISITORS, 64 SPEAKERS, 150 REGISTRATIONS)
                  </button>
                )}
                {statsItems.map((s, i) => (
                  <div key={i} className="org-admin-card org-admin-card--inline">
                    <input
                      value={s.value}
                      onChange={(e) => {
                        const next = [...statsItems];
                        next[i] = { ...next[i], value: e.target.value };
                        setDetailField("stats", next);
                      }}
                      placeholder="300+"
                      className="org-admin-input org-admin-input--sm"
                    />
                    <input
                      value={s.label}
                      onChange={(e) => {
                        const next = [...statsItems];
                        next[i] = { ...next[i], label: e.target.value };
                        setDetailField("stats", next);
                      }}
                      placeholder="EVENT VISITORS"
                      className="org-admin-input org-admin-input--wide"
                    />
                    <button
                      type="button"
                      className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                      onClick={() =>
                        setDetailField("stats", statsItems.filter((_, j) => j !== i))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="org-admin-btn org-admin-btn--secondary org-admin-btn--small"
                  onClick={() =>
                    setDetailField("stats", [...statsItems, { value: "", label: "" }])
                  }
                >
                  + Add stat
                </button>
              </div>
            </section>
          )}

          {activeSection === "topics" && (
            <section className="org-admin-block">
              <h2>Topics</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.topics as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("topics", {
                      ...(d.topics ?? {}),
                      enabled: e.target.checked,
                      content: (d.topics as { content?: string })?.content ?? "",
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Content (Markdown)</label>
                <textarea
                  value={(d.topics as { content?: string })?.content ?? ""}
                  onChange={(e) =>
                    setDetailField("topics", {
                      ...(d.topics ?? {}),
                      enabled: !!(d.topics as { enabled?: boolean })?.enabled,
                      content: e.target.value,
                    })
                  }
                  rows={5}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
            </section>
          )}

          {activeSection === "links" && (
            <section className="org-admin-block">
              <h2>Links (custom)</h2>
              <p className="org-admin-hint">Add/remove links (Twitter, GitHub, …).</p>
              {customLinks.map((link, i) => (
                <div key={i} className="org-admin-card">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...customLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setDetailField("links", { ...d.links, custom: next });
                    }}
                    placeholder="Label"
                    className="org-admin-input"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...customLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setDetailField("links", { ...d.links, custom: next });
                    }}
                    placeholder="URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField(
                        "links",
                        { ...d.links, custom: customLinks.filter((_, j) => j !== i) }
                      )
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
                  setDetailField("links", {
                    ...d.links,
                    custom: [...customLinks, { label: "", url: "" }],
                  })
                }
              >
                + Add link
              </button>
            </section>
          )}

          {activeSection === "speakers" && (
            <section className="org-admin-block">
              <h2>Speakers (detail)</h2>
              <p className="org-admin-hint">Add/remove speaker cards (name, role, avatar, bio).</p>
              {speakers.map((s, i) => (
                <div key={i} className="org-admin-card org-admin-card--nested">
                  <input
                    value={s.name}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[i] = { ...next[i], name: e.target.value };
                      setDetailField("speakers", next);
                    }}
                    placeholder="Name"
                    className="org-admin-input"
                  />
                  <input
                    value={s.role ?? ""}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[i] = { ...next[i], role: e.target.value };
                      setDetailField("speakers", next);
                    }}
                    placeholder="Role"
                    className="org-admin-input"
                  />
                  <input
                    value={s.avatar ?? ""}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[i] = { ...next[i], avatar: e.target.value };
                      setDetailField("speakers", next);
                    }}
                    placeholder="Avatar URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <textarea
                    value={s.bio ?? ""}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[i] = { ...next[i], bio: e.target.value };
                      setDetailField("speakers", next);
                    }}
                    placeholder="Bio"
                    rows={2}
                    className="org-admin-input org-admin-input--wide"
                  />
                  <input
                    value={s.twitter ?? ""}
                    onChange={(e) => {
                      const next = [...speakers];
                      next[i] = { ...next[i], twitter: e.target.value };
                      setDetailField("speakers", next);
                    }}
                    placeholder="Twitter URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField(
                        "speakers",
                        speakers.filter((_, j) => j !== i)
                      )
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
                  setDetailField("speakers", [
                    ...speakers,
                    { id: `s${Date.now()}`, name: "", role: "", avatar: "" },
                  ])
                }
              >
                + Add speaker
              </button>
            </section>
          )}

          {activeSection === "experience" && (
            <section className="org-admin-block">
              <h2>Experience</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.experience as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("experience", {
                      ...(d.experience ?? {}),
                      enabled: e.target.checked,
                      content: (d.experience as { content?: string })?.content ?? "",
                      cards: (d.experience as { cards?: EventDetailExperienceCard[] })?.cards ?? [],
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Content (Markdown – when you have no cards)</label>
                <textarea
                  value={(d.experience as { content?: string })?.content ?? ""}
                  onChange={(e) =>
                    setDetailField("experience", {
                      ...(d.experience ?? {}),
                      enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                      content: e.target.value,
                      cards: expCards,
                    })
                  }
                  rows={4}
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <h3>Cards (icon, title, description)</h3>
              {expCards.map((card, i) => (
                <div key={i} className="org-admin-card">
                  <input
                    value={card.icon}
                    onChange={(e) => {
                      const next = [...expCards];
                      next[i] = { ...next[i], icon: e.target.value };
                      setDetailField("experience", {
                        ...(d.experience ?? {}),
                        enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                        content: (d.experience as { content?: string })?.content,
                        cards: next,
                      });
                    }}
                    placeholder="Icon (shield, users, party…)"
                    className="org-admin-input"
                  />
                  <input
                    value={card.title}
                    onChange={(e) => {
                      const next = [...expCards];
                      next[i] = { ...next[i], title: e.target.value };
                      setDetailField("experience", {
                        ...(d.experience ?? {}),
                        enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                        content: (d.experience as { content?: string })?.content,
                        cards: next,
                      });
                    }}
                    placeholder="Title"
                    className="org-admin-input"
                  />
                  <input
                    value={card.description}
                    onChange={(e) => {
                      const next = [...expCards];
                      next[i] = { ...next[i], description: e.target.value };
                      setDetailField("experience", {
                        ...(d.experience ?? {}),
                        enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                        content: (d.experience as { content?: string })?.content,
                        cards: next,
                      });
                    }}
                    placeholder="Description"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("experience", {
                        ...(d.experience ?? {}),
                        enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                        content: (d.experience as { content?: string })?.content,
                        cards: expCards.filter((_, j) => j !== i),
                      })
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
                  setDetailField("experience", {
                    ...(d.experience ?? {}),
                    enabled: !!(d.experience as { enabled?: boolean })?.enabled,
                    content: (d.experience as { content?: string })?.content,
                    cards: [...expCards, { icon: "shield", title: "", description: "" }],
                  })
                }
              >
                + Add card
              </button>
            </section>
          )}

          {activeSection === "location" && (
            <section className="org-admin-block">
              <h2>Location</h2>
              {["name", "address", "city", "country", "website", "mapUrl", "directions"].map(
                (key) => (
                  <div key={key} className="org-admin-field">
                    <label>{key}</label>
                    <input
                      value={(d.location as Record<string, string>)?.[key] ?? ""}
                      onChange={(e) =>
                        setDetailField("location", {
                          ...(d.location ?? {}),
                          [key]: e.target.value || undefined,
                        })
                      }
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                )
              )}
            </section>
          )}

          {activeSection === "eventMap" && (
            <section className="org-admin-block">
              <h2>Event Map (floor plan)</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.eventMap as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("eventMap", {
                      enabled: e.target.checked,
                      imageUrl: (d.eventMap as { imageUrl?: string })?.imageUrl ?? "",
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Image URL</label>
                <input
                  value={(d.eventMap as { imageUrl?: string })?.imageUrl ?? ""}
                  onChange={(e) =>
                    setDetailField("eventMap", {
                      enabled: !!(d.eventMap as { enabled?: boolean })?.enabled,
                      imageUrl: e.target.value,
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
            </section>
          )}

          {activeSection === "schedule" && (
            <section className="org-admin-block">
              <h2>Program / Schedule</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.schedule as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("schedule", {
                      ...(d.schedule ?? {}),
                      enabled: e.target.checked,
                      stages: scheduleStages,
                      items: scheduleItems,
                    })
                  }
                />
                Show
              </label>
              <p className="org-admin-hint">
                Stages = days/stages with their own slots. Or items = a simple list.
              </p>
              {scheduleStages.length > 0 ? (
                <>
                  <h3>Stages</h3>
                  {scheduleStages.map((stage, si) => (
                    <div key={si} className="org-admin-card org-admin-card--nested">
                      <h4>{stage.name}</h4>
                      <input
                        value={stage.id}
                        onChange={(e) => {
                          const next = [...scheduleStages];
                          next[si] = { ...next[si], id: e.target.value };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: next,
                            items: scheduleItems,
                          });
                        }}
                        placeholder="Stage ID"
                        className="org-admin-input org-admin-input--tiny"
                      />
                      <input
                        value={stage.name}
                        onChange={(e) => {
                          const next = [...scheduleStages];
                          next[si] = { ...next[si], name: e.target.value };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: next,
                            items: scheduleItems,
                          });
                        }}
                        placeholder="Stage name (e.g. DAY 1)"
                        className="org-admin-input"
                      />
                      <h5>Slots</h5>
                      {stage.slots.map((slot, ji) => (
                        <div key={ji} className="org-admin-row org-admin-row--wrap">
                          <input
                            value={slot.time}
                            onChange={(e) => {
                              const next = [...scheduleStages];
                              const slots = [...next[si].slots];
                              slots[ji] = { ...slots[ji], time: e.target.value };
                              next[si] = { ...next[si], slots };
                              setDetailField("schedule", {
                                ...(d.schedule ?? {}),
                                enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                                stages: next,
                                items: scheduleItems,
                              });
                            }}
                            placeholder="Time"
                            className="org-admin-input org-admin-input--tiny"
                          />
                          <input
                            value={slot.title}
                            onChange={(e) => {
                              const next = [...scheduleStages];
                              const slots = [...next[si].slots];
                              slots[ji] = { ...slots[ji], title: e.target.value };
                              next[si] = { ...next[si], slots };
                              setDetailField("schedule", {
                                ...(d.schedule ?? {}),
                                enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                                stages: next,
                                items: scheduleItems,
                              });
                            }}
                            placeholder="Title"
                            className="org-admin-input"
                          />
                          <input
                            value={slot.speaker ?? ""}
                            onChange={(e) => {
                              const next = [...scheduleStages];
                              const slots = [...next[si].slots];
                              slots[ji] = { ...slots[ji], speaker: e.target.value };
                              next[si] = { ...next[si], slots };
                              setDetailField("schedule", {
                                ...(d.schedule ?? {}),
                                enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                                stages: next,
                                items: scheduleItems,
                              });
                            }}
                            placeholder="Speaker"
                            className="org-admin-input"
                          />
                          <button
                            type="button"
                            className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                            onClick={() => {
                              const next = [...scheduleStages];
                              const slots = next[si].slots.filter((_, k) => k !== ji);
                              next[si] = { ...next[si], slots };
                              setDetailField("schedule", {
                                ...(d.schedule ?? {}),
                                enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                                stages: next,
                                items: scheduleItems,
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="org-admin-btn org-admin-btn--small"
                        onClick={() => {
                          const next = [...scheduleStages];
                          const slots = [...next[si].slots, { time: "", title: "", speaker: "" }];
                          next[si] = { ...next[si], slots };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: next,
                            items: scheduleItems,
                          });
                        }}
                      >
                        + Add slot
                      </button>
                      <button
                        type="button"
                        className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                        onClick={() =>
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: scheduleStages.filter((_, j) => j !== si),
                            items: scheduleItems,
                          })
                        }
                      >
                        Remove stage
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small"
                    onClick={() =>
                      setDetailField("schedule", {
                        ...(d.schedule ?? {}),
                        enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                        stages: [
                          ...scheduleStages,
                          { id: `st${Date.now()}`, name: "NEW STAGE", slots: [] },
                        ],
                        items: scheduleItems,
                      })
                    }
                  >
                    + Add stage
                  </button>
                </>
              ) : (
                <>
                  <h3>Items (simple list)</h3>
                  {scheduleItems.map((item, i) => (
                    <div key={i} className="org-admin-row">
                      <input
                        value={item.time}
                        onChange={(e) => {
                          const next = [...scheduleItems];
                          next[i] = { ...next[i], time: e.target.value };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: scheduleStages,
                            items: next,
                          });
                        }}
                        placeholder="Time"
                        className="org-admin-input org-admin-input--tiny"
                      />
                      <input
                        value={item.title}
                        onChange={(e) => {
                          const next = [...scheduleItems];
                          next[i] = { ...next[i], title: e.target.value };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: scheduleStages,
                            items: next,
                          });
                        }}
                        placeholder="Title"
                        className="org-admin-input"
                      />
                      <input
                        value={item.speaker ?? ""}
                        onChange={(e) => {
                          const next = [...scheduleItems];
                          next[i] = { ...next[i], speaker: e.target.value };
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: scheduleStages,
                            items: next,
                          });
                        }}
                        placeholder="Speaker"
                        className="org-admin-input"
                      />
                      <button
                        type="button"
                        className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                        onClick={() =>
                          setDetailField("schedule", {
                            ...(d.schedule ?? {}),
                            enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                            stages: scheduleStages,
                            items: scheduleItems.filter((_, j) => j !== i),
                          })
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
                      setDetailField("schedule", {
                        ...(d.schedule ?? {}),
                        enabled: !!(d.schedule as { enabled?: boolean })?.enabled,
                        stages: scheduleStages,
                        items: [...scheduleItems, { time: "", title: "", speaker: "" }],
                      })
                    }
                  >
                    + Add item
                  </button>
                </>
              )}
            </section>
          )}

          {activeSection === "gallery" && (
            <section className="org-admin-block">
              <h2>Gallery</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.gallery as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("gallery", {
                      enabled: e.target.checked,
                      images: galleryImages,
                    })
                  }
                />
                Show
              </label>
              {galleryImages.map((img, i) => (
                <div key={i} className="org-admin-row">
                  <input
                    value={img.url}
                    onChange={(e) => {
                      const next = [...galleryImages];
                      next[i] = { ...next[i], url: e.target.value };
                      setDetailField("gallery", {
                        enabled: !!(d.gallery as { enabled?: boolean })?.enabled,
                        images: next,
                      });
                    }}
                    placeholder="Image URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("gallery", {
                        enabled: !!(d.gallery as { enabled?: boolean })?.enabled,
                        images: galleryImages.filter((_, j) => j !== i),
                      })
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
                  setDetailField("gallery", {
                    enabled: !!(d.gallery as { enabled?: boolean })?.enabled,
                    images: [...galleryImages, { url: "" }],
                  })
                }
              >
                + Add image
              </button>
            </section>
          )}

          {activeSection === "tickets" && (
            <section className="org-admin-block">
              <h2>Tickets</h2>
              <p className="org-admin-hint">
                Without guestCardImageUrl, the same image as in the events list will be used.
              </p>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.tickets as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("tickets", {
                      ...(d.tickets ?? {}),
                      enabled: e.target.checked,
                      buyUrl: (d.tickets as { buyUrl?: string })?.buyUrl,
                      guestCardImageUrl: (d.tickets as { guestCardImageUrl?: string })?.guestCardImageUrl,
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Buy URL (RSVP / registration)</label>
                <input
                  value={(d.tickets as { buyUrl?: string })?.buyUrl ?? ""}
                  onChange={(e) =>
                    setDetailField("tickets", {
                      ...(d.tickets ?? {}),
                      enabled: !!(d.tickets as { enabled?: boolean })?.enabled,
                      buyUrl: e.target.value || undefined,
                      guestCardImageUrl: (d.tickets as { guestCardImageUrl?: string })?.guestCardImageUrl,
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Guest card image URL (optional – empty = event image)</label>
                <input
                  value={(d.tickets as { guestCardImageUrl?: string })?.guestCardImageUrl ?? ""}
                  onChange={(e) =>
                    setDetailField("tickets", {
                      ...(d.tickets ?? {}),
                      enabled: !!(d.tickets as { enabled?: boolean })?.enabled,
                      buyUrl: (d.tickets as { buyUrl?: string })?.buyUrl,
                      guestCardImageUrl: e.target.value || undefined,
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
            </section>
          )}

          {activeSection === "videos" && (
            <section className="org-admin-block">
              <h2>Videos (YouTube IDs)</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.videos as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("videos", {
                      enabled: e.target.checked,
                      source: "manual",
                      youtubeIds: youtubeIds,
                    })
                  }
                />
                Show
              </label>
              <p className="org-admin-hint">{youtubeIds.length} video(s) assigned. Paste a YouTube ID or full URL — the ID will be extracted automatically.</p>
              {youtubeIds.map((id, i) => (
                <div key={i} className="org-admin-card org-admin-card--inline" style={{ alignItems: "center", gap: 12 }}>
                  {id && (
                    <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                      <img
                        src={`https://img.youtube.com/vi/${id}/default.jpg`}
                        alt=""
                        style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </a>
                  )}
                  <input
                    value={id}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      const urlMatch = val.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                      if (urlMatch) val = urlMatch[1];
                      const next = [...youtubeIds];
                      next[i] = val;
                      setDetailField("videos", {
                        enabled: !!(d.videos as { enabled?: boolean })?.enabled,
                        source: "manual",
                        youtubeIds: next,
                      });
                    }}
                    placeholder="YouTube ID or URL"
                    className="org-admin-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("videos", {
                        enabled: !!(d.videos as { enabled?: boolean })?.enabled,
                        source: "manual",
                        youtubeIds: youtubeIds.filter((_, j) => j !== i),
                      })
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
                  setDetailField("videos", {
                    enabled: !!(d.videos as { enabled?: boolean })?.enabled,
                    source: "manual",
                    youtubeIds: [...youtubeIds, ""],
                  })
                }
              >
                + Add video
              </button>
            </section>
          )}

          {activeSection === "articles" && (
            <section className="org-admin-block">
              <h2>Articles</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.articles as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("articles", {
                      enabled: e.target.checked,
                      articleIds: articleIds,
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Article IDs (comma-separated)</label>
                <input
                  value={articleIds.join(", ")}
                  onChange={(e) =>
                    setDetailField("articles", {
                      enabled: !!(d.articles as { enabled?: boolean })?.enabled,
                      articleIds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
            </section>
          )}

          {activeSection === "faq" && (
            <section className="org-admin-block">
              <h2>FAQ</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.faq as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("faq", {
                      enabled: e.target.checked,
                      items: faqItems,
                    })
                  }
                />
                Show
              </label>
              {faqItems.map((item, i) => (
                <div key={i} className="org-admin-card">
                  <input
                    value={item.question}
                    onChange={(e) => {
                      const next = [...faqItems];
                      next[i] = { ...next[i], question: e.target.value };
                      setDetailField("faq", {
                        enabled: !!(d.faq as { enabled?: boolean })?.enabled,
                        items: next,
                      });
                    }}
                    placeholder="Question"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => {
                      const next = [...faqItems];
                      next[i] = { ...next[i], answer: e.target.value };
                      setDetailField("faq", {
                        enabled: !!(d.faq as { enabled?: boolean })?.enabled,
                        items: next,
                      });
                    }}
                    placeholder="Answer"
                    rows={2}
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("faq", {
                        enabled: !!(d.faq as { enabled?: boolean })?.enabled,
                        items: faqItems.filter((_, j) => j !== i),
                      })
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
                  setDetailField("faq", {
                    enabled: !!(d.faq as { enabled?: boolean })?.enabled,
                    items: [...faqItems, { question: "", answer: "" }],
                  })
                }
              >
                + Add question
              </button>
            </section>
          )}

          {activeSection === "sponsors" && (
            <section className="org-admin-block">
              <h2>Sponsors</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.sponsors as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("sponsors", {
                      ...(d.sponsors ?? {}),
                      enabled: e.target.checked,
                      becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                      items: sponsorItems,
                    })
                  }
                />
                Show
              </label>
              <div className="org-admin-field">
                <label>Become sponsor email</label>
                <input
                  value={(d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail ?? ""}
                  onChange={(e) =>
                    setDetailField("sponsors", {
                      ...(d.sponsors ?? {}),
                      enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                      becomeSponsorEmail: e.target.value || undefined,
                      items: sponsorItems,
                    })
                  }
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              {sponsorItems.map((s, i) => (
                <div key={i} className="org-admin-card">
                  <input
                    value={s.name}
                    onChange={(e) => {
                      const next = [...sponsorItems];
                      next[i] = { ...next[i], name: e.target.value };
                      setDetailField("sponsors", {
                        ...(d.sponsors ?? {}),
                        enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                        becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                        items: next,
                      });
                    }}
                    placeholder="Name"
                    className="org-admin-input"
                  />
                  <input
                    value={s.logo ?? ""}
                    onChange={(e) => {
                      const next = [...sponsorItems];
                      next[i] = { ...next[i], logo: e.target.value };
                      setDetailField("sponsors", {
                        ...(d.sponsors ?? {}),
                        enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                        becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                        items: next,
                      });
                    }}
                    placeholder="Logo URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <input
                    value={s.url ?? ""}
                    onChange={(e) => {
                      const next = [...sponsorItems];
                      next[i] = { ...next[i], url: e.target.value };
                      setDetailField("sponsors", {
                        ...(d.sponsors ?? {}),
                        enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                        becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                        items: next,
                      });
                    }}
                    placeholder="URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <input
                    value={s.twitter ?? ""}
                    onChange={(e) => {
                      const next = [...sponsorItems];
                      next[i] = { ...next[i], twitter: e.target.value };
                      setDetailField("sponsors", {
                        ...(d.sponsors ?? {}),
                        enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                        becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                        items: next,
                      });
                    }}
                    placeholder="Twitter"
                    className="org-admin-input"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("sponsors", {
                        ...(d.sponsors ?? {}),
                        enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                        becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                        items: sponsorItems.filter((_, j) => j !== i),
                      })
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
                  setDetailField("sponsors", {
                    ...(d.sponsors ?? {}),
                    enabled: !!(d.sponsors as { enabled?: boolean })?.enabled,
                    becomeSponsorEmail: (d.sponsors as { becomeSponsorEmail?: string })?.becomeSponsorEmail,
                    items: [...sponsorItems, { name: "", logo: "", url: "" }],
                  })
                }
              >
                + Add sponsor
              </button>
            </section>
          )}

          {activeSection === "contributors" && (
            <section className="org-admin-block">
              <h2>Contributors</h2>
              <label className="org-admin-check">
                <input
                  type="checkbox"
                  checked={!!(d.contributors as { enabled?: boolean })?.enabled}
                  onChange={(e) =>
                    setDetailField("contributors", {
                      enabled: e.target.checked,
                      items: contributorItems,
                    })
                  }
                />
                Show
              </label>
              {contributorItems.map((c, i) => (
                <div key={i} className="org-admin-card">
                  <input
                    value={c.name}
                    onChange={(e) => {
                      const next = [...contributorItems];
                      next[i] = { ...next[i], name: e.target.value };
                      setDetailField("contributors", {
                        enabled: !!(d.contributors as { enabled?: boolean })?.enabled,
                        items: next,
                      });
                    }}
                    placeholder="Name"
                    className="org-admin-input"
                  />
                  <input
                    value={c.role ?? ""}
                    onChange={(e) => {
                      const next = [...contributorItems];
                      next[i] = { ...next[i], role: e.target.value };
                      setDetailField("contributors", {
                        enabled: !!(d.contributors as { enabled?: boolean })?.enabled,
                        items: next,
                      });
                    }}
                    placeholder="Role / handle"
                    className="org-admin-input"
                  />
                  <input
                    value={c.avatar ?? ""}
                    onChange={(e) => {
                      const next = [...contributorItems];
                      next[i] = { ...next[i], avatar: e.target.value };
                      setDetailField("contributors", {
                        enabled: !!(d.contributors as { enabled?: boolean })?.enabled,
                        items: next,
                      });
                    }}
                    placeholder="Avatar URL"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() =>
                      setDetailField("contributors", {
                        enabled: !!(d.contributors as { enabled?: boolean })?.enabled,
                        items: contributorItems.filter((_, j) => j !== i),
                      })
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
                  setDetailField("contributors", {
                    enabled: !!(d.contributors as { enabled?: boolean })?.enabled,
                    items: [...contributorItems, { name: "", role: "", avatar: "" }],
                  })
                }
              >
                + Add contributor
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

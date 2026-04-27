"use client";

import { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { useOrgContent } from "@/lib/org/OrgContentContext";
import { isUpcoming, sortEventsByDate } from "@/lib/org/events-constants";
import { readEventsListSessionCache, writeEventsListSessionCache } from "@/lib/org/events-list-session-cache";
import { consumeScrollAfterLayout, EVENTS_SCROLL_KEY } from "@/lib/scroll-memory";
import { EventsHero } from "./events/EventsHero";
import { EventsFilters } from "./events/EventsFilters";
import { EventsUpcoming } from "./events/EventsUpcoming";
import { EventsFeaturedBlock } from "./events/EventsFeaturedBlock";
import { EventsPast } from "./events/EventsPast";

type EventItem = {
  id: string;
  type?: string;
  date?: string;
  city?: string;
  country?: string;
  title?: string;
  place?: string;
  premium?: boolean;
  design?: { image?: string };
  links?: { web?: string };
};

type EventDetail = { headerImageUrl?: string; [key: string]: unknown };

export function OrgEventsContent() {
  const [eventsState, setEventsState] = useState<{
    events: EventItem[];
    details: Record<string, EventDetail>;
    error: string | null;
    loadedKey: string | null;
  }>({
    events: [],
    details: {},
    error: null,
    loadedKey: null,
  });
  const [countryFilter, setCountryFilter] = useState<string[]>([]);

  const content = useOrgContent();
  const eventsPageConfig = (content?.eventsPage ?? {}) as {
    hero?: Record<string, unknown>;
    featured?: Record<string, unknown>;
    eventsFeaturedIds?: string[];
    eventsOverrides?: Record<string, string>;
  };
  const about = content?.about as { gallery?: { images?: string[] } } | undefined;
  const heroFromConfig = eventsPageConfig.hero ?? {};
  const heroGalleryImages = (heroFromConfig as { galleryImages?: string[] }).galleryImages;
  const heroWithGallery = {
    ...heroFromConfig,
    galleryImages:
      Array.isArray(heroGalleryImages) && heroGalleryImages.length > 0
        ? heroGalleryImages
        : about?.gallery?.images ?? [],
  };
  const featuredIds = useMemo(
    () => eventsPageConfig.eventsFeaturedIds ?? [],
    [eventsPageConfig.eventsFeaturedIds]
  );
  const featuredKey = JSON.stringify(featuredIds);
  const overrides = eventsPageConfig.eventsOverrides ?? {};
  const loading = eventsState.loadedKey !== featuredKey && eventsState.error === null;
  const events = eventsState.events;
  const details = eventsState.details;
  const error = eventsState.error;

  useLayoutEffect(() => {
    const cached = readEventsListSessionCache(featuredKey);
    if (!cached) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync sessionStorage rehydration before paint (back from detail)
    setEventsState({
      events: cached.events as EventItem[],
      details: cached.details as Record<string, EventDetail>,
      error: null,
      loadedKey: featuredKey,
    });
  }, [featuredKey]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/org/events")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load events (${response.status})`);
        }
        return response.json();
      })
      .then((data: { events?: EventItem[]; details?: Record<string, EventDetail> }) => {
        if (cancelled) return;
        const list = data.events ?? [];
        const nextDetails = data.details ?? {};
        writeEventsListSessionCache(featuredKey, list, nextDetails);
        setEventsState({
          events: list,
          details: nextDetails,
          error: null,
          loadedKey: featuredKey,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setEventsState({
            events: [],
            details: {},
            error: (err as Error)?.message ?? "Failed to load events",
            loadedKey: featuredKey,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [featuredIds, featuredKey]);

  useEffect(() => {
    if (loading) return;
    consumeScrollAfterLayout(EVENTS_SCROLL_KEY);
  }, [loading]);

  const filtered = useMemo(() => {
    let list = events;
    if (countryFilter.length > 0) {
      const code = countryFilter[0].toLowerCase();
      list = list.filter((e) => (e.country ?? "").toLowerCase() === code);
    }
    return list;
  }, [events, countryFilter]);

  const locationFiltered = countryFilter.length > 0;

  const { upcoming, past } = useMemo(() => {
    const up = sortEventsByDate(
      filtered.filter((e) => isUpcoming(e)),
      true
    ) as EventItem[];
    const pa = sortEventsByDate(
      filtered.filter((e) => !isUpcoming(e)),
      false
    ) as EventItem[];
    return { upcoming: up, past: pa };
  }, [filtered]);

  return (
    <main className="landing-root events-page">
      <div className="events-page-inner">
        <EventsHero hero={heroWithGallery as any} />

        <div className="events-content-wrap">
          {error && (
            <p className="events-error" role="alert">
              {error}
            </p>
          )}

          <div className="events-toolbar">
            <EventsFilters
              countryFilter={countryFilter}
              onCountryFilterChange={setCountryFilter}
              events={events}
            />
          </div>

          {loading ? (
            <div className="events-skeleton-wrap" aria-busy="true" aria-label="Loading events">
              <div className="events-skeleton-section">
                <div className="events-skeleton-heading" />
                <div className="events-card-list events-skeleton-list">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="events-skeleton-card">
                      <div className="events-skeleton-card-media" />
                      <div className="events-skeleton-card-body">
                        <div className="events-skeleton-line events-skeleton-line--title" />
                        <div className="events-skeleton-line events-skeleton-line--date" />
                        <div className="events-skeleton-line events-skeleton-line--meta" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="events-skeleton-section">
                <div className="events-skeleton-heading" />
                <div className="events-card-list events-skeleton-list">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="events-skeleton-card">
                      <div className="events-skeleton-card-media" />
                      <div className="events-skeleton-card-body">
                        <div className="events-skeleton-line events-skeleton-line--title" />
                        <div className="events-skeleton-line events-skeleton-line--date" />
                        <div className="events-skeleton-line events-skeleton-line--meta" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <EventsUpcoming events={upcoming} overrides={overrides} details={details} />
              {!locationFiltered && <EventsFeaturedBlock featured={eventsPageConfig.featured} />}
              <EventsPast events={past} overrides={overrides} details={details} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

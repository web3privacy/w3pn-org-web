"use client";

import { useState } from "react";
import { EventCardOrg } from "./EventCardOrg";

const PAGE_SIZE = 10;

type Event = {
  id: string;
  date?: string;
  title?: string;
  type?: string;
  city?: string;
  country?: string;
  place?: string;
  premium?: boolean;
  design?: { image?: string };
  links?: { web?: string };
};

type EventDetail = { headerImageUrl?: string };

export function EventsPast({
  events,
  overrides = {},
  details = {},
}: {
  events: Event[];
  overrides?: Record<string, string>;
  details?: Record<string, EventDetail>;
}) {
  const [showCount, setShowCount] = useState(PAGE_SIZE);

  if (!events || events.length === 0) return null;

  const displayed = events.slice(0, showCount);
  const hasMore = events.length > showCount;

  const byYear = displayed.reduce<Record<string, Event[]>>((acc, e) => {
    const y = e.date ? new Date(e.date).getFullYear() : "Other";
    if (!acc[y]) acc[y] = [];
    acc[y].push(e);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <section className="events-past">
      <h2 className="events-section-heading">PAST</h2>
      {years.map((year) => (
        <div key={year} className="events-year-group">
          <h3 className="events-year-label">{year}</h3>
          <div className="events-card-list">
            {byYear[year].map((event) => (
              <EventCardOrg key={event.id} event={event} override={overrides} detail={details[event.id]} isPast />
            ))}
          </div>
        </div>
      ))}
      {hasMore && (
        <div className="events-past-cta">
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowCount((n) => n + PAGE_SIZE)}
          >
            SHOW MORE EVENTS
          </button>
        </div>
      )}
    </section>
  );
}

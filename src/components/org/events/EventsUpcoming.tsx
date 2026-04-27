"use client";

import { EventCardOrg } from "./EventCardOrg";

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

export function EventsUpcoming({
  events,
  overrides = {},
  details = {},
}: {
  events: Event[];
  overrides?: Record<string, string>;
  details?: Record<string, EventDetail>;
}) {
  if (!events || events.length === 0) return null;

  const byYear = events.reduce<Record<string, Event[]>>((acc, e) => {
    const y = e.date ? new Date(e.date).getFullYear() : "Other";
    if (!acc[y]) acc[y] = [];
    acc[y].push(e);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(a) - Number(b));

  return (
    <section className="events-upcoming" id="upcoming">
      <h2 className="events-section-heading">UPCOMING</h2>
      {years.map((year) => (
        <div key={year} className="events-year-group">
          <h3 className="events-year-label">{year}</h3>
          <div className="events-card-list">
            {byYear[year].map((event) => (
              <EventCardOrg
                key={event.id}
                event={event}
                override={overrides}
                detail={details[event.id]}
                isPast={false}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

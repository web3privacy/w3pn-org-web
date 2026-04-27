import { loadAllEventsForAdmin } from "@/lib/events";
import Link from "next/link";
import { getEventTypeLabel } from "@/lib/org/events-constants";
import { format, isValid, parseISO } from "date-fns";
import "@/styles/org/admin.css";

export const metadata = {
  title: "Events Admin",
  description: "Edit event data for org web.",
};

export default function OrgEventsAdminPage() {
  const events = loadAllEventsForAdmin();

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Events Admin – Org Web</h1>
        <div className="org-admin-actions">
          <Link href="/events" className="org-admin-btn org-admin-btn--secondary">
            ← Back to Events
          </Link>
        </div>
      </div>

      <div className="org-admin-form">
        <section className="org-admin-block">
          <h2>Events</h2>
          <p className="org-admin-hint">
            Click Edit to open an event for editing. Data is stored in data/events/index.yaml and details/*.yaml.
          </p>
          <ul className="org-admin-events-list">
            {events.map((event) => {
              const parsed = parseISO(event.date);
              const dateStr = isValid(parsed)
                ? format(parsed, "d. M. yyyy")
                : event.date;
              const title =
                event.title ?? `${getEventTypeLabel(event.type)} – ${event.city}`;
              return (
                <li key={event.id} className="org-admin-events-item">
                  <span className="org-admin-events-meta">{dateStr} · {event.city}</span>
                  <span className="org-admin-events-title">{title}</span>
                  <Link
                    href={`/events/admin/edit/${event.id}`}
                    className="org-admin-btn org-admin-btn--small org-admin-btn--primary"
                  >
                    Edit
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

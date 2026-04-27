import { loadAllEventsForAdmin } from "@/lib/events";
import { loadEventDetail } from "@/lib/event-details";
import { getEventById, getEventDetailById } from "@/lib/org/events-data";
import { EventAdminEditor } from "@/components/org/events/EventAdminEditor";
import { notFound } from "next/navigation";
import type { Event } from "@/types/events";
import type { EventItem } from "@/lib/org/events-types";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Edit Event",
};

function toEvent(item: EventItem): Event {
  return {
    id: item.id,
    type: (item.type as Event["type"]) ?? "meetup",
    date: item.date ?? "",
    city: item.city ?? "",
    country: item.country ?? "",
    title: item.title,
    description: item.description,
    place: item.place,
    "place-address": item["place-address"],
    lead: item.lead ?? "",
    links: item.links,
    speakers: item.speakers,
    design: item.design,
    premium: item.premium,
  };
}

export default async function OrgEventAdminEditPage({ params }: Props) {
  const { id } = await params;
  let event: Event | null = loadAllEventsForAdmin().find((e) => e.id === id) ?? null;
  let detail = loadEventDetail(id);

  if (!event) {
    const orgEvent = getEventById(id);
    if (!orgEvent) notFound();
    event = toEvent(orgEvent);
    detail = getEventDetailById(id) ?? null;
  }

  return <EventAdminEditor event={event} initialDetail={detail} />;
}

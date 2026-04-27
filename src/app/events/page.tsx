import { OrgEventsContent } from "@/components/org/OrgEventsContent";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Events",
  description: "Meetups, workshops, conferences, and hackathons focused on privacy and digital freedom.",
  path: "/events",
});

export default function OrgEventsPage() {
  return <OrgEventsContent />;
}

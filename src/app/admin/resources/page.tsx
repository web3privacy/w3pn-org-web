import { getOrgDefaultContent } from "@/lib/org/default-content";
import ResourcesAdminEditor from "@/components/org/ResourcesAdminEditor";

export const metadata = {
  title: "Resources Admin",
  description: "Manage resource categories, kits, and assets.",
};

export default function ResourcesAdminPage() {
  const content = getOrgDefaultContent();
  const resources = (content.resources ?? {}) as Record<string, unknown>;
  return <ResourcesAdminEditor initialResources={resources} />;
}

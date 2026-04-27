import type { ProjectListItem } from "@/components/org/OrgProjectsContent";
import { OrgProjectsContent } from "@/components/org/OrgProjectsContent";
import {
  getProjectsByCategory,
  getCategoryOrder,
  getCategoryLabel,
} from "@/lib/org/w3pn-projects";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Projects",
  description: "Privacy data, infrastructure, education, media, and community tools curated by Web3Privacy Now.",
  path: "/projects",
});

export default function OrgProjectsPage() {
  const byCategoryMap = getProjectsByCategory();
  const categoryOrder = [...getCategoryOrder()];
  const projectsByCategory: Record<string, ProjectListItem[]> = {};
  for (const cat of categoryOrder) {
    projectsByCategory[cat] = [...(byCategoryMap.get(cat) ?? [])] as ProjectListItem[];
  }
  const categoryLabels = Object.fromEntries(categoryOrder.map((c) => [c, getCategoryLabel(c)]));

  return (
    <OrgProjectsContent
      projectsByCategory={projectsByCategory}
      categoryOrder={categoryOrder}
      categoryLabels={categoryLabels}
    />
  );
}

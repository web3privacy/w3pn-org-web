import { getOrgDefaultContent } from "@/lib/org/default-content";
import OrgResourcesContent from "@/components/org/OrgResourcesContent";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Resources",
  description: "Community resources, downloadable assets, articles, and guides from Web3Privacy Now.",
  path: "/resources",
});

export default function OrgResourcesPage() {
  const content = getOrgDefaultContent();
  return <OrgResourcesContent content={content} />;
}

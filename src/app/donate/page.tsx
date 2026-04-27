import { getOrgDefaultContent } from "@/lib/org/default-content";
import OrgDonateContent from "@/components/org/OrgDonateContent";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Donate",
  description: "Support the Web3Privacy Now mission to defend digital freedom through research, education, and community work.",
  path: "/donate",
});

export default function OrgDonatePage() {
  const content = getOrgDefaultContent();
  return <OrgDonateContent content={content} />;
}

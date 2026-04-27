import OrgAboutPageClient from "@/components/org/OrgAboutPageClient";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "About",
  description: "Learn about the mission, people, values, and history behind Web3Privacy Now.",
  path: "/about",
});

export default function OrgAboutPage() {
  return <OrgAboutPageClient />;
}

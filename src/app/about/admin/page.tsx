import { getOrgDefaultContent } from "@/lib/org/default-content";
import AboutAdminEditor from "@/components/org/AboutAdminEditor";

export const metadata = {
  title: "About Admin",
  description: "Edit About Us page content.",
};

export default function AboutAdminPage() {
  const content = getOrgDefaultContent();
  return <AboutAdminEditor initialContent={content} />;
}

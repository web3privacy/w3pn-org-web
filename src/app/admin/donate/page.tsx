import { getOrgDefaultContent } from "@/lib/org/default-content";
import DonateAdminEditor from "@/components/org/DonateAdminEditor";

export const metadata = {
  title: "Donate Admin",
  description: "Edit donate page content.",
};

export default function DonateAdminPage() {
  const content = getOrgDefaultContent();
  return <DonateAdminEditor initialContent={content} />;
}

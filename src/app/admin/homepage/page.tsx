import { getOrgDefaultContent } from "@/lib/org/default-content";
import AdminEditor from "@/components/org/AdminEditor";

export const metadata = {
  title: "Admin Homepage",
  description: "Edit homepage content.",
};

export default function OrgAdminHomepagePage() {
  const content = getOrgDefaultContent();
  return <AdminEditor initialContent={content} />;
}

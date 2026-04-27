"use client";

import { useOrgContent } from "@/lib/org/OrgContentContext";
import OrgAboutContent from "@/components/org/OrgAboutContent";

export default function OrgAboutPageClient() {
  const content = useOrgContent();
  return <OrgAboutContent content={content} />;
}

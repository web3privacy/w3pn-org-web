/** Homepage – renders the full org landing page via OrgLandingContent. */

"use client";

import { useOrgContent } from "@/lib/org/OrgContentContext";
import OrgLandingContent from "@/components/org/OrgLandingContent";

export default function OrgHomePage() {
  const content = useOrgContent();
  return <OrgLandingContent content={content} />;
}

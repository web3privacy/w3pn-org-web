import { assertAdminSessionOrRedirect } from "@/lib/admin-auth-server";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Events Admin",
  description: "Web3Privacy Now events admin area.",
  path: "/events/admin",
  noIndex: true,
});

export default async function EventsAdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdminSessionOrRedirect();
  return <>{children}</>;
}

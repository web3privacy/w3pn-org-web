import { assertAdminSessionOrRedirect } from "@/lib/admin-auth-server";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "About Admin",
  description: "Web3Privacy Now about page admin area.",
  path: "/about/admin",
  noIndex: true,
});

export default async function AboutAdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdminSessionOrRedirect();
  return <>{children}</>;
}

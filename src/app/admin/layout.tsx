import { assertAdminSessionOrRedirect } from "@/lib/admin-auth-server";
import { buildMetadata } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Web3Privacy Now admin area.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  await assertAdminSessionOrRedirect();
  return <>{children}</>;
}

import Link from "next/link";
import { getProject } from "@/lib/org/w3pn-projects";
import { buildMetadata } from "@/lib/site-config";

const PROJECT_ID = "privacy-portal";

export const metadata = buildMetadata({
  title: "Privacy Portal",
  description:
    "The unified Privacy Portal hub is in the works. Learn more on the project page while we finish the standalone experience.",
  path: "/privacy-portal",
});

export default function PrivacyPortalComingSoonPage() {
  const project = getProject(PROJECT_ID);
  const name = typeof project?.name === "string" ? project.name : "Privacy Portal";
  const icon =
    typeof project?.icon === "string" && project.icon.length > 0
      ? project.icon
      : "/images/projects/items/privacy-portal/icon/project-privacy-portal.webp";

  return (
    <main className="portal-coming-soon">
      <div className="portal-coming-soon__inner">
        <p className="portal-coming-soon__eyebrow">Under construction</p>
        <img className="portal-coming-soon__logo" src={icon} alt="" width={140} height={140} />
        <h1 className="portal-coming-soon__title">{name}</h1>
        <p className="portal-coming-soon__lead">
          We&apos;re building a dedicated space for this project. It isn&apos;t live yet, but we&apos;re actively working on
          it—thank you for your patience.
        </p>
        <p className="portal-coming-soon__muted">
          In the meantime, you can read the full overview, roadmap, and updates on the project page on this site.
        </p>
        <Link href={`/projects/${PROJECT_ID}`} className="outline-btn portal-coming-soon__cta">
          Open project page
        </Link>
      </div>
    </main>
  );
}

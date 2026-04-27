import Link from "next/link";
import { getProjects, getAllProjects } from "@/lib/org/w3pn-projects";
import { getCategoryLabel } from "@/lib/org/w3pn-projects";
import "@/styles/org/admin.css";

export const metadata = {
  title: "Projects Admin",
  description: "Edit projects display and content.",
};

export default function OrgProjectsAdminPage() {
  const allProjects = getAllProjects();
  const visibleCount = getProjects().length;

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Projects</h1>
        <div className="org-admin-actions">
          <Link href="/projects" className="org-admin-btn org-admin-btn--secondary" target="_blank">
            View Projects
          </Link>
        </div>
      </div>

      <div className="org-admin-form">
        <section className="org-admin-block">
          <h2>Projects ({visibleCount} visible, {allProjects.length} total)</h2>
          <p className="org-admin-hint">
            Edit order, category, visibility, and detail content. Refresh the page after saving to see changes.
          </p>
          <ul className="org-admin-events-list">
            {allProjects.map((p) => (
              <li key={p.id} className="org-admin-events-item">
                <span className="org-admin-events-meta">
                  #{p.order ?? "–"} · {getCategoryLabel(p.category ?? "")}
                  {(p as { hidden?: boolean }).hidden && " · hidden"}
                </span>
                <span className="org-admin-events-title">{String(p.name ?? p.id)}</span>
                <Link
                  href={`/admin/projects/${p.id}/edit`}
                  className="org-admin-btn org-admin-btn--small org-admin-btn--primary"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

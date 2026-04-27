import Link from "next/link";
import "@/styles/org/admin.css";
import { getAdminCategoriesMeta } from "@/lib/org/admin-category-meta";
import AdminExportButtons from "@/components/org/AdminExportButtons";

export const metadata = {
  title: "Admin",
  description: "Edit projects, events, and org content.",
};

const IconProjects = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const IconEvents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconHomepage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconAbout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconDonate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconResources = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const IconLogs = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
);
const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default async function OrgAdminHubPage() {
  const meta = getAdminCategoriesMeta();

  const sections = [
    {
      id: "projects",
      title: "Projects",
      description: "Edit project order, visibility, categories, and each project's detail content.",
      href: "/admin/projects",
      primary: true,
      icon: IconProjects,
      meta: meta.projects,
    },
    {
      id: "events",
      title: "Events",
      description: "Edit event listings and details (hero, program, sponsors, etc.).",
      href: "/events/admin",
      primary: true,
      icon: IconEvents,
      meta: meta.events,
    },
    {
      id: "homepage",
      title: "Homepage",
      description: "Edit main page content (hero, partners, activities, etc.).",
      href: "/admin/homepage",
      primary: false,
      icon: IconHomepage,
      meta: meta.homepage,
    },
    {
      id: "about",
      title: "About Us",
      description: "Edit the About page (hero, mission, team, partners, FAQ, etc.).",
      href: "/about/admin",
      primary: false,
      icon: IconAbout,
      meta: meta.about,
    },
    {
      id: "donate",
      title: "Donate",
      description: "Edit the Donate page (hero, NFTs, donation amounts, membership tiers).",
      href: "/admin/donate",
      primary: false,
      icon: IconDonate,
      meta: meta.donate,
    },
    {
      id: "resources",
      title: "Resources",
      description: "Manage resource categories, kits, and assets (logos, posters, banners, media files).",
      href: "/admin/resources",
      primary: true,
      icon: IconResources,
      meta: meta.resources,
    },
    {
      id: "mailingList",
      title: "Mailing list",
      description: "View and remove emails collected from the footer newsletter signup form.",
      href: "/admin/mailing-list",
      primary: false,
      icon: IconMail,
      meta: meta.mailingList,
    },
    {
      id: "logs",
      title: "Audit Logs",
      description: "Review who signed in and what content was changed in the admin.",
      href: "/admin/logs",
      primary: false,
      icon: IconLogs,
      meta: meta.logs,
    },
  ];

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Dashboard</h1>
      </div>

      <div className="admin-hub-grid">
        {sections.map(({ id, title, description, href, primary, icon: Icon, meta: m }) => (
          <section key={id} className="org-admin-block org-admin-block--hub">
            <div className="org-admin-block__icon">
              <Icon />
            </div>
            <div className="org-admin-block__main">
              <h2>{title}</h2>
              <p className="org-admin-hint">{description}</p>
              <div className="org-admin-meta">
                <span className="org-admin-meta__date">Last updated: {m.lastModifiedLabel}</span>
              </div>
              <Link
                href={href}
                className={`org-admin-btn ${primary ? "org-admin-btn--primary" : "org-admin-btn--secondary"}`}
              >
                Manage {title}
              </Link>
            </div>
          </section>
        ))}
      </div>

      {/* Export section */}
      <div className="org-admin-block admin-export-section">
        <h2>Export Data</h2>
        <p className="org-admin-hint">Download the latest versions of the data files used by this website.</p>
        <AdminExportButtons />
      </div>
    </div>
  );
}

"use client";

import { useLayoutEffect } from "react";
import { consumeScrollAfterLayout, PROJECTS_SCROLL_KEY } from "@/lib/scroll-memory";
import { ProjectsHero } from "./projects/ProjectsHero";
import { ProjectsByCategory } from "./projects/ProjectsByCategory";

export type ProjectListItem = {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  category?: string;
  [k: string]: unknown;
};

type OrgProjectsContentProps = {
  projectsByCategory: Record<string, ProjectListItem[]>;
  categoryOrder: string[];
  categoryLabels: Record<string, string>;
};

export function OrgProjectsContent({
  projectsByCategory,
  categoryOrder,
  categoryLabels,
}: OrgProjectsContentProps) {
  useLayoutEffect(() => {
    consumeScrollAfterLayout(PROJECTS_SCROLL_KEY);
  }, []);

  return (
    <main style={{ width: "100%", minHeight: "100vh" }} className="projects-page landing-root">
      <div className="content-shell content-shell--with-padding" style={{ paddingBottom: 0 }}>
        <ProjectsHero />
        <div className="projects-page-listing-wrap" style={{ paddingTop: 0, paddingBottom: 32 }}>
          <ProjectsByCategory
            projectsByCategory={projectsByCategory}
            categoryOrder={categoryOrder}
            categoryLabels={categoryLabels}
          />
        </div>
      </div>
    </main>
  );
}

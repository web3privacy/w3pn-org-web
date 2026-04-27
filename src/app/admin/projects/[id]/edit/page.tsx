import { getProjectForAdmin, getProjectDetail } from "@/lib/org/w3pn-projects";
import { ProjectAdminEditor } from "@/components/org/projects/ProjectAdminEditor";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Edit Project",
};

export default async function OrgProjectAdminEditPage({ params }: Props) {
  const { id } = await params;
  const project = getProjectForAdmin(id);
  const detail = getProjectDetail(id);

  if (!project) notFound();

  return (
    <ProjectAdminEditor
      project={{
        id: project.id,
        name: (project as { name?: string }).name,
        description: (project as { description?: string }).description,
        category: (project as { category?: string }).category,
        order: (project as { order?: number }).order,
        image: (project as { image?: string }).image,
        newsTag: (project as { newsTag?: string }).newsTag,
        links: (project as { links?: Record<string, string> }).links,
        hidden: (project as { hidden?: boolean }).hidden,
      }}
      initialDetail={detail}
    />
  );
}

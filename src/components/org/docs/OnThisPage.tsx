"use client";

function slugify(text: string): string {
  return String(text)
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** Extract h2 and h3 from markdown source for "On this page" links */
export function extractHeadings(md: string): { level: number; text: string; id: string }[] {
  if (!md) return [];
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h2) headings.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1]) });
    if (h3) headings.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1]) });
  }
  return headings;
}

export default function OnThisPage({
  headings,
}: {
  headings: { level: number; text: string; id: string }[];
}) {
  if (!headings || headings.length === 0) return null;
  return (
    <nav className="docs-on-this-page" aria-label="On this page">
      <h2 className="docs-on-this-page-title">On this page</h2>
      <ul className="docs-on-this-page-list">
        {headings.map((h, i) => (
          <li key={i} className={`docs-on-this-page-item docs-on-this-page-h${h.level}`}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

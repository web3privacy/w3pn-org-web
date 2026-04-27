/**
 * Converts MDX content (from web3privacy/docs) into plain Markdown suitable for
 * react-markdown. Removes Astro/Starlight-specific syntax and metadata.
 */

function getAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "s");
  const m = attrs.match(re);
  return m ? m[1].trim() : null;
}

export function sanitizeMdxForMarkdown(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let s = raw;

  // 1. Strip frontmatter (--- ... ---)
  s = s.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");

  // 2. Strip import statements
  s = s.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*\r?\n?/gm, "");

  // 3. Transform <LinkCard ... /> into markdown list item
  s = s.replace(/<LinkCard\s*([\s\S]*?)\s*\/>/g, (_, attrs) => {
    const title = getAttr(attrs, "title");
    const href = getAttr(attrs, "href");
    if (!title || !href) return "";
    const linkHref = href.startsWith("/") && !href.startsWith("//") ? `/docs${href}` : href;
    return `- [${title}](${linkHref})`;
  });

  // 4. Remove <CardGrid> and </CardGrid>
  s = s.replace(/\s*<CardGrid>\s*/g, "\n\n");
  s = s.replace(/\s*<\/CardGrid>\s*/g, "\n\n");

  // 5. Strip remaining JSX/component-like tags (PascalCase)
  s = s.replace(/<[A-Z][\w]*[\w\s="'-]*\s*\/>\s*/g, "");
  s = s.replace(/<[A-Z][\w]*[\w\s="'-]*>\s*/g, "");
  s = s.replace(/\s*<\/[A-Z][\w]*>/g, "");

  // 6. Clean up multiple blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

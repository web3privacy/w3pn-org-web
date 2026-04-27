/**
 * Extract 11-char YouTube video id from watch / embed / shorts / youtu.be URLs or a bare id.
 */
export function parseYoutubeVideoId(urlOrId: string | undefined): string | null {
  if (!urlOrId?.trim()) return null;
  const value = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (!host.endsWith("youtube.com")) return null;
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const embed = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embed) return embed[1];
    const shorts = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts) return shorts[1];
  } catch {
    /* invalid URL */
  }
  return null;
}

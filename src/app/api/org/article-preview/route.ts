import { NextRequest, NextResponse } from "next/server";

const WIDTH = 1200;
const HEIGHT = 630;

const KIND_LABELS: Record<string, string> = {
  project: "PROJECT",
  event: "EVENT",
  news: "NEWS",
  article: "ARTICLE",
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    pushCurrent();
    if (word.length > maxChars) {
      lines.push(word.slice(0, Math.max(0, maxChars - 1)) + "…");
    } else {
      current = word;
    }
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines) pushCurrent();

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines - 1).concat(`${lines[maxLines - 1].slice(0, Math.max(0, maxChars - 1))}…`);
  }

  if (lines.length === maxLines && current) {
    const last = lines[maxLines - 1];
    if (last.length + current.length + 1 > maxChars) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, maxChars - 1))}…`;
    }
  }

  return lines;
}

function buildTextBlock(lines: string[], x: number, y: number, fontSize: number, lineGap: number, fill: string): string {
  if (!lines.length) return "";
  const tspans = lines
    .map((line, idx) => {
      if (idx === 0) return `<tspan x="${x}" y="${y}">${escapeXml(line)}</tspan>`;
      return `<tspan x="${x}" dy="${lineGap}">${escapeXml(line)}</tspan>`;
    })
    .join("");
  return `<text fill="${fill}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="-0.03em">${tspans}</text>`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = (params.get("title") ?? "Article").trim() || "Article";
  const subtitle = (params.get("subtitle") ?? "").trim();
  const kind = (params.get("kind") ?? "article").trim().toLowerCase();
  const seed = (params.get("seed") ?? title).trim();
  const hash = hashString(`${title}|${subtitle}|${kind}|${seed}`);
  const hue = hash % 360;
  const hue2 = (hue + 42) % 360;
  const hue3 = (hue + 180) % 360;
  const titleLines = wrapText(title, 22, 3);
  const subtitleLines = subtitle ? wrapText(subtitle, 42, 2) : [];
  const titleX = 80;
  const titleY = 220;
  const subtitleY = titleY + titleLines.length * 76 + 34;
  const gradientId = `g${hash.toString(16)}`;
  const accent = `hsl(${hue2} 92% 62%)`;
  const chipLabel = KIND_LABELS[kind] ?? KIND_LABELS.article;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue} 56% 12%)" />
      <stop offset="100%" stop-color="hsl(${hue2} 54% 8%)" />
    </linearGradient>
    <radialGradient id="${gradientId}-glow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#${gradientId})" />
  <circle cx="980" cy="110" r="220" fill="url(#${gradientId}-glow)" />
  <circle cx="180" cy="500" r="300" fill="url(#${gradientId}-glow)" />
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="rgba(255,255,255,0.05)" />
  <rect x="80" y="80" width="120" height="40" rx="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
  <text x="140" y="107" fill="rgba(255,255,255,0.85)" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="0.16em">${escapeXml(chipLabel)}</text>
  <rect x="80" y="150" width="12" height="220" rx="6" fill="${accent}" />
  ${buildTextBlock(titleLines, titleX, titleY, 60, 72, "#f7f8fa")}
  ${subtitleLines.length ? buildTextBlock(subtitleLines, titleX, subtitleY, 28, 40, "rgba(255,255,255,0.74)") : ""}
  <text x="80" y="570" fill="rgba(255,255,255,0.45)" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600">Web3Privacy Now</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

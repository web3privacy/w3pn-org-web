import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { getAppPackageRoot } from "@/lib/app-package-root";
import { getReadableDataPath, getWritableDataPath } from "@/lib/runtime-paths";

const ROOT = getAppPackageRoot();

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function readDir(dirPath: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath).filter((f) => !f.startsWith("."));
  } catch {
    return [];
  }
}

/** Download CMS snapshots for backup (requires admin session when ADMIN_PASSWORD is set). */
export async function GET(request: NextRequest) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  const type = request.nextUrl.searchParams.get("type");

  if (type === "content") {
    const filePath = getReadableDataPath("org", "defaultContent.yaml");
    const raw = readFile(filePath);
    if (!raw) return NextResponse.json({ error: "File not found" }, { status: 404 });
    return new NextResponse(raw, {
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": 'attachment; filename="defaultContent.yaml"',
      },
    });
  }

  if (type === "projects") {
    const projectsPath = getReadableDataPath("org", "projects", "index.yaml");
    const detailsDir = fs.existsSync(getWritableDataPath("org", "projects", "details"))
      ? getWritableDataPath("org", "projects", "details")
      : path.join(ROOT, "data", "org", "projects", "details");
    const lines: string[] = [];
    const projectsRaw = readFile(projectsPath);
    if (projectsRaw) {
      lines.push(`# === index.yaml ===`);
      lines.push(projectsRaw);
      lines.push("");
    }
    for (const name of readDir(detailsDir)) {
      const raw = readFile(path.join(detailsDir, name));
      if (raw) {
        lines.push(`# === details/${name} ===`);
        lines.push(raw);
        lines.push("");
      }
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": 'attachment; filename="projects.yaml"',
      },
    });
  }

  if (type === "events") {
    const eventsDir = path.join(ROOT, "data", "events");
    const detailsDir = fs.existsSync(getWritableDataPath("events", "details"))
      ? getWritableDataPath("events", "details")
      : path.join(eventsDir, "details");
    const lines: string[] = [];

    const eventFiles = [
      path.join(eventsDir, "index.yaml"),
      getReadableDataPath("events", "events-user.yaml"),
      getReadableDataPath("events", "events-visibility.yaml"),
    ];
    for (const filePath of eventFiles) {
      const raw = readFile(filePath);
      if (raw) {
        lines.push(`# === ${path.basename(filePath)} ===`);
        lines.push(raw);
        lines.push("");
      }
    }

    for (const name of readDir(detailsDir)) {
      const raw = readFile(path.join(detailsDir, name));
      if (raw) {
        lines.push(`# === details/${name} ===`);
        lines.push(raw);
        lines.push("");
      }
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": 'attachment; filename="events.yaml"',
      },
    });
  }

  return NextResponse.json({ error: "Unknown type. Use ?type=content|projects|events" }, { status: 400 });
}

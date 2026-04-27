import { getReadableDataPath } from "@/lib/runtime-paths";
import { loadYaml } from "@/lib/yaml-utils";

export interface VideoCatalogEntry {
  youtubeId: string;
  title: string;
  speaker: string;
  role: string;
  event?: string;
  tags?: string[];
}

interface VideoCatalogFile {
  videos: VideoCatalogEntry[];
}

const CATALOG_PATH = getReadableDataPath("media", "videos.yaml");

let _cache: Map<string, VideoCatalogEntry> | null = null;

function loadCatalog(): Map<string, VideoCatalogEntry> {
  if (_cache) return _cache;
  const data = loadYaml<VideoCatalogFile | null>(CATALOG_PATH, null);
  const map = new Map<string, VideoCatalogEntry>();
  if (data?.videos) {
    for (const v of data.videos) {
      if (v.youtubeId) map.set(v.youtubeId, v);
    }
  }
  _cache = map;
  return map;
}

export function getVideoMeta(youtubeId: string): VideoCatalogEntry | null {
  return loadCatalog().get(youtubeId) ?? null;
}

export function getVideosMeta(youtubeIds: string[]): VideoCatalogEntry[] {
  const catalog = loadCatalog();
  return youtubeIds.map((id) => catalog.get(id) ?? {
    youtubeId: id,
    title: "",
    speaker: "",
    role: "",
  });
}

export function getAllVideos(): VideoCatalogEntry[] {
  return Array.from(loadCatalog().values());
}

"use client";

import { useCallback, useState } from "react";
import { useAdminToast } from "@/components/org/AdminToast";

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const EXPORTS = [
  { type: "content", label: "Content (YAML)", filename: "defaultContent.yaml" },
  { type: "projects", label: "Projects (YAML)", filename: "projects.yaml" },
  { type: "events", label: "Events (YAML)", filename: "events.yaml" },
] as const;

export default function AdminExportButtons() {
  const { addToast } = useAdminToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = useCallback(async (type: string, filename: string) => {
    setLoading(type);
    try {
      const res = await fetch(`/api/org/export?type=${type}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("success", `Exported ${filename}`);
    } catch {
      addToast("error", `Failed to export ${filename}`);
    } finally {
      setLoading(null);
    }
  }, [addToast]);

  return (
    <div className="admin-export-grid">
      {EXPORTS.map((exp) => (
        <button
          key={exp.type}
          type="button"
          className="admin-export-btn"
          onClick={() => handleExport(exp.type, exp.filename)}
          disabled={loading === exp.type}
        >
          <DownloadIcon />
          {loading === exp.type ? "Exporting..." : exp.label}
        </button>
      ))}
    </div>
  );
}

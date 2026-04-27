"use client";

import { useCallback, useRef, useState } from "react";
import { useAdminToast } from "@/components/org/AdminToast";

type Folder = "uploads" | "gallery" | "hero" | "projects" | "donate";

type Props = {
  folder?: Folder;
  label?: string;
  onUploaded: (url: string) => void;
  onUploadedResult?: (data: { ok?: boolean; url?: string; path?: string; thumbnailUrl?: string; thumbnailPath?: string }) => void;
};

export default function AdminFileUpload({ folder = "uploads", label = "Upload file", onUploaded, onUploadedResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { addToast } = useAdminToast();

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/upload?folder=${folder}`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; url?: string; path?: string; thumbnailUrl?: string; thumbnailPath?: string };
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.url) onUploaded(data.url);
        onUploadedResult?.(data);
        addToast("success", "File uploaded");
      } catch (err) {
        addToast("error", err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
        e.target.value = "";
      }
    },
    [folder, onUploaded, onUploadedResult, addToast]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
        className="org-admin-file-input-hidden"
        aria-hidden
        tabIndex={-1}
        onChange={onChange}
      />
      <button
        type="button"
        className="org-admin-btn org-admin-btn--small org-admin-btn--secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}

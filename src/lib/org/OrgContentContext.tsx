/**
 * React context for org-wide CMS content. Provides default content from JSON,
 * with optional admin preview override via localStorage + ?preview=1 query param.
 */

"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";

export const ORG_ADMIN_PREVIEW_KEY = "orgAdminPreviewContent";

export type Content = Record<string, unknown>;

const OrgContentContext = createContext<Content | null>(null);

function getPreviewState(initialContent: Content) {
  if (typeof window === "undefined") {
    return { isPreview: false, override: null as Content | null };
  }

  const isPreview = window.location.search.includes("preview=1");
  if (!isPreview) {
    return { isPreview, override: null as Content | null };
  }

  try {
    const raw = window.localStorage.getItem(ORG_ADMIN_PREVIEW_KEY);
    return { isPreview, override: raw ? (JSON.parse(raw) as Content) : initialContent };
  } catch {
    return { isPreview, override: null as Content | null };
  }
}

export function useOrgContent(): Content {
  const ctx = useContext(OrgContentContext);
  return ctx ?? {};
}

export function OrgContentProvider({
  initialContent,
  children,
}: {
  initialContent: Content;
  children: React.ReactNode;
}) {
  const [{ isPreview, override }] = useState(() => getPreviewState(initialContent));

  const content = useMemo(
    () => (isPreview && override !== null ? override : initialContent),
    [initialContent, isPreview, override]
  );

  return (
    <OrgContentContext.Provider value={content}>
      {children}
    </OrgContentContext.Provider>
  );
}

export function useSetOrgPreviewContent() {
  return useCallback((content: Content) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ORG_ADMIN_PREVIEW_KEY, JSON.stringify(content));
  }, []);
}

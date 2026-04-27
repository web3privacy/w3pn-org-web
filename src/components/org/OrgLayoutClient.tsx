/**
 * Client-side layout shell. Wraps pages in OrgContentProvider, renders the
 * nav header and GlobalFooter, and fetches GitHub community members for the footer.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GlobalFooter } from "@/components/org/global-footer";
import OrgNavHeader from "@/components/org/OrgNavHeader";
import AdminShell from "@/components/org/AdminShell";
import { getOrgGlobalFooterConfig } from "@/lib/org/global-footer-config";
import { sanitizeNewsletterActionUrl } from "@/lib/newsletter-action";
import { OrgContentProvider, useOrgContent } from "@/lib/org/OrgContentContext";

const GITHUB_API = "https://api.github.com";
const ORG = "web3privacy";
const MAILING_LIST_KEY = "w3pn_mailing_list";

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

async function getGitHubCommunityMembers(limit: number): Promise<Array<{ login: string; avatarUrl: string; profileUrl: string }>> {
  try {
    const [members, repos] = await Promise.all([
      fetchJson(`${GITHUB_API}/orgs/${ORG}/members?per_page=100`),
      fetchJson(`${GITHUB_API}/orgs/${ORG}/repos?sort=updated&per_page=6&type=public`),
    ]);
    const repoNames = (repos as { name: string; fork?: boolean }[]).filter((r) => !r.fork).map((r) => r.name).slice(0, 4);
    const contributors = await Promise.all(
      repoNames.map((name) => fetchJson(`${GITHUB_API}/repos/${ORG}/${name}/contributors?per_page=50`).catch(() => []))
    );
    const users = new Map<string, { login: string; avatarUrl: string; profileUrl: string; score: number }>();
    (members as { login: string; avatar_url: string; html_url: string }[]).forEach((u) => {
      if (u?.login && u?.avatar_url && u?.html_url) users.set(u.login, { login: u.login, avatarUrl: u.avatar_url, profileUrl: u.html_url, score: 10 });
    });
    contributors.flat().forEach((entry: { user?: { login: string; avatar_url: string; html_url: string }; login?: string; avatar_url?: string; html_url?: string }) => {
      const u = entry?.user ?? entry;
      if (!u?.login || !u?.avatar_url || !u?.html_url) return;
      const existing = users.get(u.login);
      const score = existing ? existing.score + 1 : 1;
      users.set(u.login, { login: u.login, avatarUrl: u.avatar_url, profileUrl: u.html_url, score });
    });
    return Array.from(users.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score: _s, ...rest }) => rest);
  } catch {
    return [];
  }
}

type Content = Record<string, unknown>;

function normalizePath(p: string): string {
  return p.replace(/\/$/, "") || "/";
}

function OrgLayoutInner({ children }: { children: React.ReactNode }) {
  const content = useOrgContent();
  const pathnameFromRouter = usePathname() ?? "";
  const pathNorm = normalizePath(pathnameFromRouter);

  const isLoginPage = pathNorm === "/admin/login";
  const isAdmin =
    !isLoginPage &&
    (pathNorm.startsWith("/admin") || pathNorm.startsWith("/events/admin") || pathNorm.startsWith("/about/admin"));
  const [communityMembers, setCommunityMembers] = useState<Array<{ login: string; avatarUrl: string; profileUrl: string }>>([]);
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    getGitHubCommunityMembers(280).then(setCommunityMembers).catch(() => {});
  }, []);

  const footerConfig = getOrgGlobalFooterConfig(content);
  const newsletterConfig = (content.newsletter ?? {}) as { actionUrl?: string };
  const newsletterActionUrl = sanitizeNewsletterActionUrl(newsletterConfig.actionUrl);

  async function handleNewsletterSubmit(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterState("error");
      setNewsletterMessage("Please provide a valid email address.");
      return;
    }
    setNewsletterState("loading");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/org/mailing-list/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Subscription failed.");
      }
      const existing = JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem(MAILING_LIST_KEY) ?? "[]" : "[]");
      const nextList = Array.isArray(existing) ? existing : [];
      if (!nextList.includes(normalizedEmail)) nextList.push(normalizedEmail);
      if (typeof window !== "undefined") window.localStorage.setItem(MAILING_LIST_KEY, JSON.stringify(nextList));
      if (newsletterActionUrl) {
        const ext = await fetch(newsletterActionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        }).catch(() => null);
        if (ext && !ext.ok) {
          /* optional external integration — do not fail the user */
        }
      }
      setNewsletterState("success");
      setNewsletterMessage("Subscribed. Thank you.");
    } catch (e) {
      setNewsletterState("error");
      setNewsletterMessage(e instanceof Error ? e.message : "Subscription failed. Please try again.");
    }
  }

  if (isLoginPage) {
    /* Full-page login only: site top-nav is fixed and was covering the centered password form */
    return <>{children}</>;
  }

  if (isAdmin) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <div className="org-web-root landing-root">
      <OrgNavHeader content={content} />
      <div>{children}</div>
      <GlobalFooter
        config={footerConfig}
        communityMembers={communityMembers}
        onNewsletterSubmit={handleNewsletterSubmit}
        newsletterState={newsletterState}
        newsletterMessage={newsletterMessage}
        variant="org"
      />
    </div>
  );
}

export default function OrgLayoutClient({
  content,
  children,
}: {
  content: Content;
  children: React.ReactNode;
}) {
  return (
    <OrgContentProvider initialContent={content}>
      <OrgLayoutInner>{children}</OrgLayoutInner>
    </OrgContentProvider>
  );
}

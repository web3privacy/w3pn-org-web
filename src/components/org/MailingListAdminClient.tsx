"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

export type MailingListSubscriberRow = { email: string; subscribedAt: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MailingListAdminClient({ initialSubscribers }: { initialSubscribers: MailingListSubscriberRow[] }) {
  const [subscribers, setSubscribers] = useState<MailingListSubscriberRow[]>(initialSubscribers);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/mailing-list", { credentials: "include" });
    if (!res.ok) {
      setError("Could not load the mailing list.");
      return;
    }
    const data = (await res.json()) as { subscribers?: MailingListSubscriberRow[] };
    setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
    setError(null);
  }, []);

  async function removeOne(email: string) {
    setRemoving(email);
    setError(null);
    try {
      const res = await fetch("/api/admin/mailing-list", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; subscribers?: MailingListSubscriberRow[] };
      if (!res.ok) {
        setError(data.error ?? "Remove failed.");
        return;
      }
      if (Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      } else {
        await refresh();
      }
    } catch {
      setError("Remove failed.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <div>
          <h1>Mailing list</h1>
          <p className="org-admin-hint">
            Email addresses collected from the site footer newsletter form. Stored in{" "}
            <span className="org-admin-meta__path">data/org/mailing-list.json</span>.
          </p>
        </div>
        <Link href="/admin" className="org-admin-btn org-admin-btn--secondary">
          Back to Dashboard
        </Link>
      </div>

      {error ? (
        <p className="org-admin-hint" style={{ color: "#c44" }}>
          {error}
        </p>
      ) : null}

      <section className="org-admin-block">
        <div className="org-admin-meta">
          <span className="org-admin-meta__date">Subscribers: {subscribers.length}</span>
        </div>
      </section>

      {subscribers.length === 0 ? (
        <section className="org-admin-block">
          <h2>No subscribers yet</h2>
          <p className="org-admin-hint">Submissions from the footer &quot;Subscribe&quot; button will appear here.</p>
        </section>
      ) : (
        <section className="org-admin-block">
          <div style={{ overflowX: "auto" }}>
            <table className="org-admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    Email
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    Subscribed
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => (
                  <tr key={row.email}>
                    <td style={{ padding: "10px 12px", wordBreak: "break-all" }}>{row.email}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDate(row.subscribedAt)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <button
                        type="button"
                        className="org-admin-btn org-admin-btn--secondary"
                        disabled={removing === row.email}
                        onClick={() => removeOne(row.email)}
                      >
                        {removing === row.email ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

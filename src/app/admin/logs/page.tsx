import Link from "next/link";
import "@/styles/org/admin.css";
import { ADMIN_AUDIT_LOG_FILE, readAdminAuditEntries } from "@/lib/admin-audit";

export const metadata = {
  title: "Audit Logs",
  description: "Review admin logins and content changes.",
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminLogsPage() {
  const entries = readAdminAuditEntries(250);

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="org-admin-hint">
            Recent admin sign-ins, uploads, and content changes. Newest entries are shown first.
          </p>
        </div>
        <Link href="/admin" className="org-admin-btn org-admin-btn--secondary">
          Back to Dashboard
        </Link>
      </div>

      <section className="org-admin-block">
        <div className="org-admin-meta">
          <span className="org-admin-meta__date">Entries shown: {entries.length}</span>
          <span className="org-admin-meta__path">File: {ADMIN_AUDIT_LOG_FILE}</span>
        </div>
      </section>

      {entries.length === 0 ? (
        <section className="org-admin-block">
          <h2>No audit entries yet</h2>
          <p className="org-admin-hint">
            The log will start filling as soon as someone signs in or saves content through the admin.
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {entries.map((entry) => (
            <section key={entry.id} className="org-admin-block">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2 style={{ marginBottom: 8 }}>{entry.summary}</h2>
                  <div className="org-admin-meta">
                    <span className="org-admin-meta__date">{formatTimestamp(entry.timestamp)}</span>
                    <span className="org-admin-meta__path">Actor: {entry.actorName}</span>
                    <span className="org-admin-meta__path">IP: {entry.ip}</span>
                    <span className="org-admin-meta__path">Action: {entry.action}</span>
                  </div>
                </div>
                {entry.target ? (
                  <span className="org-admin-meta__path" style={{ maxWidth: 420, wordBreak: "break-word" }}>
                    Target: {entry.target}
                  </span>
                ) : null}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="org-admin-hint">Route: {entry.route}</div>
                {entry.details ? (
                  <pre
                    style={{
                      marginTop: 12,
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      overflowX: "auto",
                      fontSize: 12,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { readMailingList, removeMailingListSubscriber, type MailingListSubscriber } from "@/lib/org/mailing-list-file";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

export async function GET(request: Request) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  const subscribers: MailingListSubscriber[] = readMailingList();
  return NextResponse.json({ subscribers });
}

export async function DELETE(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      { error: "Write operations are disabled on this deployment (read-only filesystem)." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string" ? (body as { email: string }).email : "";
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  try {
    const removed = removeMailingListSubscriber(normalized);
    if (!removed) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }
    await appendAdminAuditEntryFromRequest(request, {
      action: "mailing_list.remove",
      target: "data/org/mailing-list.json",
      summary: `Removed mailing list subscriber: ${normalized}`,
      details: { email: normalized },
    });
    return NextResponse.json({ ok: true, subscribers: readMailingList() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove subscriber." },
      { status: 500 }
    );
  }
}

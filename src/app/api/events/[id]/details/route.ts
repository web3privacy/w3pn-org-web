import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import {
  AdminValidationError,
  parseAdminIdentifier,
  parseEventDetailBody,
} from "@/lib/admin-validation";
import { loadEventDetail, saveEventDetail } from "@/lib/event-details";
import type { EventDetail } from "@/types/event-detail";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const { id: rawId } = await params;
  let id: string;
  try {
    id = parseAdminIdentifier(rawId, "Event id");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  const detail = loadEventDetail(id);
  const res = NextResponse.json(detail ?? null);
  return res;
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      { error: "Write operations are disabled in production." },
      { status: 403 }
    );
  }
  const { id: rawId } = await params;
  let id: string;
  try {
    id = parseAdminIdentifier(rawId, "Event id");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const existing = loadEventDetail(id);
  let merged: EventDetail;
  try {
    merged = parseEventDetailBody(id, body, existing);
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  saveEventDetail(merged);
  await appendAdminAuditEntryFromRequest(request, {
    action: "events.detail.update",
    target: `data/events/details/${id}.yaml`,
    summary: `Updated event detail: ${id}`,
    details: {
      eventId: id,
      keys: Object.keys(body as Record<string, unknown>),
    },
  });
  return NextResponse.json({ ok: true });
}

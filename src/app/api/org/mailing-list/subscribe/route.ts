import { NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/admin-rate-limit";
import { appendMailingListSubscriber } from "@/lib/org/mailing-list-file";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** In-memory rate limit: max subscriptions per IP per hour (best-effort on multi-instance). */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;
const subscribeHits = new Map<string, number[]>();

function allowSubscribe(ip: string): boolean {
  const now = Date.now();
  const arr = (subscribeHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) return false;
  arr.push(now);
  subscribeHits.set(ip, arr);
  return true;
}

export async function POST(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      {
        error:
          "Newsletter signup is not available on this read-only deployment. Run the site locally or on a host with filesystem writes.",
      },
      { status: 503 }
    );
  }

  const ip = getClientIpFromRequest(request);
  if (!allowSubscribe(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string" ? (body as { email: string }).email : "";
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    const { added } = appendMailingListSubscriber(normalized);
    return NextResponse.json({ ok: true, added });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save subscription." },
      { status: 500 }
    );
  }
}

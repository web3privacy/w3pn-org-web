import { NextResponse } from "next/server";
import { getEventsList, getEventDetailById } from "@/lib/org/events-data";

/** Returns events and details from YAML (merged with events-user, filtered by visibility). */
export async function GET() {
  try {
    const events = getEventsList();
    const details: Record<string, unknown> = {};
    for (const e of events) {
      const d = getEventDetailById(e.id);
      if (d) details[e.id] = d;
    }
    return NextResponse.json({ events, details });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to load events" },
      { status: 500 }
    );
  }
}

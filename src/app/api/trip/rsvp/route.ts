import { NextResponse } from "next/server";
import { readTrip, writeTrip } from "@/lib/store";
import type { RsvpStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RsvpBody {
  familyId: string;
  rsvp: RsvpStatus;
  toggledBy?: string;
}

/**
 * 공개 endpoint — 가족 누구나 자기 가족의 도착 RSVP 토글 가능.
 * 토글한 사람 이름을 기록해서 가족 카드에 "— 혜숙" 식으로 노출.
 */
export async function POST(req: Request) {
  let body: RsvpBody;
  try {
    body = (await req.json()) as RsvpBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (
    !body?.familyId ||
    !["confirmed", "tentative", "pending"].includes(body.rsvp)
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const trip = await readTrip();
  const idx = trip.families.findIndex((f) => f.id === body.familyId);
  if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const next = {
    ...trip,
    families: trip.families.map((f, i) =>
      i === idx
        ? {
            ...f,
            rsvp: body.rsvp,
            rsvpBy: body.toggledBy?.slice(0, 30) || f.rsvpBy,
            rsvpAt: Date.now(),
          }
        : f,
    ),
  };
  const saved = await writeTrip(next);
  return NextResponse.json(saved);
}

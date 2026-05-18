import { NextResponse } from "next/server";
import { readTrip, writeTrip } from "@/lib/store";
import type { ChecklistItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ToggleBody {
  id: string;
  checked: boolean;
  toggledBy?: string;
}

/**
 * 가족 누구나 호출 가능 — 체크리스트 토글 전용.
 * 항목 추가/삭제는 admin PUT /api/trip 에서 처리.
 */
export async function POST(req: Request) {
  let body: ToggleBody;
  try {
    body = (await req.json()) as ToggleBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body?.id || typeof body.checked !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const trip = await readTrip();
  const idx = trip.checklist.findIndex((c) => c.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated: ChecklistItem = {
    ...trip.checklist[idx],
    checked: body.checked,
    toggledBy: body.toggledBy?.slice(0, 30) || trip.checklist[idx].toggledBy,
    updatedAt: Date.now(),
  };
  const next = {
    ...trip,
    checklist: trip.checklist.map((c, i) => (i === idx ? updated : c)),
  };
  const saved = await writeTrip(next);
  return NextResponse.json(saved);
}

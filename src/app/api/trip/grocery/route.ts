import { NextResponse } from "next/server";
import { readTrip, writeTrip } from "@/lib/store";

export const dynamic = "force-dynamic";

interface TogglePurchasedBody {
  id: string;
  purchased: boolean;
  actualCost?: number | null;
}

/** 장보기 — purchased 토글 + 실 비용 기록 (누구나) */
export async function POST(req: Request) {
  let body: TogglePurchasedBody;
  try {
    body = (await req.json()) as TogglePurchasedBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body?.id || typeof body.purchased !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const trip = await readTrip();
  const idx = trip.groceries.findIndex((g) => g.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const item = trip.groceries[idx];
  const next = {
    ...trip,
    groceries: trip.groceries.map((g, i) =>
      i === idx
        ? {
            ...item,
            purchased: body.purchased,
            actualCost:
              body.actualCost === null
                ? undefined
                : body.actualCost ?? item.actualCost,
          }
        : g,
    ),
  };
  const saved = await writeTrip(next);
  return NextResponse.json(saved);
}

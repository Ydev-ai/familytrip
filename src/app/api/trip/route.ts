import { NextResponse } from "next/server";
import { readTrip, writeTrip } from "@/lib/store";
import { isValidAdminKey } from "@/lib/admin";
import type { Trip } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const trip = await readTrip();
  return NextResponse.json(trip, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(req: Request) {
  const key = req.headers.get("x-admin-key") ?? "";
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Trip;
  try {
    body = (await req.json()) as Trip;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const saved = await writeTrip(body);
  return NextResponse.json(saved);
}

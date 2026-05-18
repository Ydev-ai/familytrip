import { kv } from "@vercel/kv";
import { DEFAULT_TRIP, type Trip, type Budget } from "./types";
import { sanitizeHttpUrl } from "./url";

const KEY = "trip:current";

/**
 * KV 가 환경변수 미설정 상태(로컬 첫 실행)일 때는 in-memory fallback.
 * Vercel 배포 시점에 KV 가 자동 주입되며 fallback 은 죽고 진짜 KV 가 동작.
 */
let memoryFallback: Trip | null = null;

function kvAvailable() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * 구버전 KV 데이터에 budget/groceries 가 없을 수 있으므로 read 시 normalize.
 * 그리고 admin 이 자유 입력한 URL 필드는 `javascript:` 같은 prefix 차단을 위해 sanitize.
 */
function normalize(trip: Partial<Trip> | null | undefined): Trip {
  const base = trip ?? {};
  const budget: Budget = {
    perPerson: base.budget?.perPerson,
    note: base.budget?.note,
    payments: base.budget?.payments ?? [],
    expenses: base.budget?.expenses ?? [],
  };
  const place = {
    ...DEFAULT_TRIP.place,
    ...(base.place ?? {}),
    mapUrl: sanitizeHttpUrl(base.place?.mapUrl) ?? DEFAULT_TRIP.place.mapUrl,
    embedSrc: sanitizeHttpUrl(base.place?.embedSrc),
  };
  const families = (base.families ?? DEFAULT_TRIP.families).map((f) => ({
    ...f,
    photoUrl: sanitizeHttpUrl(f.photoUrl),
  }));
  return {
    ...DEFAULT_TRIP,
    ...(base as Trip),
    place,
    hero: { ...DEFAULT_TRIP.hero, ...(base.hero ?? {}) },
    schedule: base.schedule ?? DEFAULT_TRIP.schedule,
    families,
    checklist: base.checklist ?? DEFAULT_TRIP.checklist,
    groceries: base.groceries ?? DEFAULT_TRIP.groceries,
    budget,
    updatedAt: base.updatedAt ?? Date.now(),
  };
}

export async function readTrip(): Promise<Trip> {
  if (kvAvailable()) {
    try {
      const data = await kv.get<Trip>(KEY);
      if (data) return normalize(data);
      await kv.set(KEY, DEFAULT_TRIP);
      return DEFAULT_TRIP;
    } catch (err) {
      console.error("[store] kv read failed, falling back to memory", err);
    }
  }
  if (!memoryFallback) memoryFallback = structuredClone(DEFAULT_TRIP);
  return memoryFallback;
}

export async function writeTrip(next: Trip): Promise<Trip> {
  const stamped: Trip = { ...normalize(next), updatedAt: Date.now() };
  if (kvAvailable()) {
    try {
      await kv.set(KEY, stamped);
      return stamped;
    } catch (err) {
      console.error("[store] kv write failed, falling back to memory", err);
    }
  }
  memoryFallback = stamped;
  return stamped;
}

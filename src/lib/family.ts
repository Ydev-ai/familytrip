import type { Family, FamilyColor, RsvpStatus } from "./types";

/**
 * "혜숙네" → "혜숙", "할머니" → "할머", "정하네" → "정하".
 * 마지막 "네/댁/집" 한 글자 떨궈낸 뒤 앞 두 글자만 가져옴.
 */
export function familyInitial(label: string): string {
  const stripped = label.replace(/[\s]/g, "").replace(/(네|댁|집)$/u, "");
  return (stripped || label).slice(0, 2);
}

export const FAMILY_COLORS: FamilyColor[] = [
  "ink",
  "dancheong",
  "maple",
  "gold",
  "celadon",
  "plum",
];

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  confirmed: "도착 확정",
  tentative: "조정 중",
  pending: "응답 대기",
};

/** RSVP 토글 사이클: pending → confirmed → tentative → pending */
export function nextRsvp(current: RsvpStatus | undefined): RsvpStatus {
  switch (current) {
    case "confirmed":
      return "tentative";
    case "tentative":
      return "pending";
    case "pending":
    default:
      return "confirmed";
  }
}

export function totalHeadcount(families: Family[]): number {
  return families.reduce(
    (sum, f) => sum + Math.max(f.headcount, f.members.length),
    0,
  );
}

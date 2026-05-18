/**
 * Admin secret URL — env 미설정 시 dev 기본값.
 * 운영(NODE_ENV=production) 에서 ADMIN_SECRET 이 없으면 모든 admin 시도 거부.
 */
const RAW = process.env.ADMIN_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

/** 운영에서 env 미설정 시 빈 문자열 → isValidAdminKey 가 항상 false 반환. */
export const ADMIN_SECRET = RAW ?? (IS_PROD ? "" : "dev-secret-change-me-please-32chars");

/** 운영 환경에서 admin 이 사용 가능한지 (배포 직후 env 누락 안내용) */
export const ADMIN_CONFIGURED = Boolean(RAW) || !IS_PROD;

export function isValidAdminKey(key: string | undefined | null) {
  if (!key) return false;
  if (!ADMIN_SECRET) return false;
  if (key.length < 8) return false;
  if (key.length !== ADMIN_SECRET.length) return false;
  // constant-time-ish compare
  let mismatch = 0;
  for (let i = 0; i < key.length; i++) {
    mismatch |= key.charCodeAt(i) ^ ADMIN_SECRET.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * admin 이 자유 입력하는 URL — `javascript:` / `data:` 같은 prefix 차단.
 * 빈 입력이면 undefined 반환해서 호출부가 분기.
 *
 * - http / https / // (protocol-relative) / `/` (same-origin path) 만 통과
 * - 카카오/네이버 임베드 src 는 항상 https 라 안전
 */
export function sanitizeHttpUrl(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const t = input.trim();
  if (!t) return undefined;
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return undefined;
}

/**
 * admin 에서 카카오/네이버 임베드를 "iframe HTML 통째로 붙여넣어도" 동작하도록
 * src 속성만 추출. 이미 URL 만 들어오면 그대로 통과.
 */
export function extractIframeSrc(input: string): string {
  const t = (input ?? "").trim();
  if (!t) return "";
  // 흔한 케이스: <iframe ... src="..." ...></iframe> 또는 같은 따옴표 src='...'
  if (t.toLowerCase().includes("<iframe")) {
    const m1 = t.match(/src\s*=\s*"([^"]+)"/i);
    if (m1) return m1[1];
    const m2 = t.match(/src\s*=\s*'([^']+)'/i);
    if (m2) return m2[1];
  }
  return t;
}

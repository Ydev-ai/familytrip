/**
 * 카카오/네이버 API key 없이 좌표만으로 지도 임베드 — OpenStreetMap.
 *  ⌐ embedSrc 우선 (admin 이 카카오/네이버 임베드 코드를 직접 붙여넣었을 때)
 *  ⌐ 없으면 lat/lng 로 OSM iframe URL 생성
 */
export function buildOsmEmbed(lat: number, lng: number): string {
  // 0.005° ≈ 약 500m 너비 — 풀빌라 한 채에 적당
  const dLat = 0.003;
  const dLng = 0.005;
  const bbox = [
    (lng - dLng).toFixed(5),
    (lat - dLat).toFixed(5),
    (lng + dLng).toFixed(5),
    (lat + dLat).toFixed(5),
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function pickMapEmbed(
  place: { embedSrc?: string; lat?: number; lng?: number },
): string | null {
  if (place.embedSrc) return place.embedSrc;
  if (typeof place.lat === "number" && typeof place.lng === "number") {
    return buildOsmEmbed(place.lat, place.lng);
  }
  return null;
}

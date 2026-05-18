"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTrip } from "@/lib/swr-client";
import type { Trip } from "@/lib/types";

/**
 * SWR fetch 실패가 일정 시간 지속될 때만 작은 banner 노출.
 * 깜빡임 방지 — 1회 실패는 무시, 4초 이상 지속되면 표시.
 */
export function ConnectionBanner({ initial }: { initial: Trip }) {
  const { error } = useTrip(initial);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!error) {
      setShow(false);
      return;
    }
    const timer = window.setTimeout(() => setShow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 top-3 z-50 inline-flex items-center gap-2 px-4 py-2.5 bg-maple-700 text-hanji-50 rounded-full shadow-[0_8px_24px_-8px_rgba(168,58,37,0.4)] text-sm"
    >
      <AlertTriangle className="w-4 h-4" />
      서버와 연결이 잠시 끊겼어요. 자동으로 다시 시도 중…
    </div>
  );
}

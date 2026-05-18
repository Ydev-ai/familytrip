"use client";

import { useEffect } from "react";

const SECRET_KEY = "family-trip:admin-secret";

/**
 * admin 페이지에 들어온 사람의 기기에 secret 을 localStorage 로 기록.
 * 다음부터는 공개 페이지의 "수정" floating 버튼이 자동 활성화됩니다.
 * (어른들은 admin URL 을 다시 안 외워도 됩니다.)
 */
export function StoreSecret({ secret }: { secret: string }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(SECRET_KEY, secret);
    } catch {
      /* noop — private mode 등 */
    }
  }, [secret]);
  return null;
}

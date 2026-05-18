"use client";

import { useEffect, useState } from "react";
import { Pencil, X, Link as LinkIcon, Check } from "lucide-react";

const SECRET_KEY = "family-trip:admin-secret";
const HINT_DISMISSED = "family-trip:admin-hint-dismissed";

/**
 * admin URL 을 한 번이라도 방문한 기기에서는 secret 이 localStorage 에 기억됩니다.
 * 메인 페이지 우하단에 floating "✏ 수정" 버튼이 활성화되어 어른들도 1탭에 진입.
 */
export function AdminShortcut() {
  const [secret, setSecret] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);

  useEffect(() => {
    const s = window.localStorage.getItem(SECRET_KEY);
    setSecret(s);
    setHintDismissed(window.localStorage.getItem(HINT_DISMISSED) === "1");
  }, []);

  if (!secret) return null;

  const adminUrl = `/admin/${secret}`;

  async function copyAdminLink() {
    try {
      const url = `${window.location.origin}${adminUrl}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  function dismissHint() {
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_DISMISSED, "1");
    } catch {
      /* noop */
    }
  }

  function clearSecret() {
    try {
      window.localStorage.removeItem(SECRET_KEY);
      window.localStorage.removeItem(HINT_DISMISSED);
    } catch {
      /* noop */
    }
    setSecret(null);
    setMenuOpen(false);
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2">
      {/* 첫 진입자 hint */}
      {!hintDismissed && !menuOpen && (
        <div className="hanji-card max-w-[280px] p-4 pr-3 mb-1 relative">
          <button
            type="button"
            onClick={dismissHint}
            className="absolute top-1.5 right-1.5 p-1 text-ink-400 hover:text-ink-700"
            aria-label="알림 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-sm text-ink-900 font-medium leading-snug">
            이 기기에서 바로 수정할 수 있어요
          </p>
          <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">
            아래 <strong className="text-ink-900">수정</strong> 버튼을 누르면
            일정·가족·회비 등을 마음대로 바꿀 수 있습니다.
          </p>
        </div>
      )}

      {/* 메뉴 펼침 */}
      {menuOpen && (
        <div className="hanji-card p-2 mb-1 flex flex-col gap-0.5 min-w-[210px]">
          <a
            href={adminUrl}
            className="flex items-center gap-2.5 px-3 py-3 text-sm text-ink-900 hover:bg-ink-900/5 rounded-sm"
          >
            <Pencil className="w-4 h-4" />
            여행 정보 수정하기
          </a>
          <button
            type="button"
            onClick={copyAdminLink}
            className="flex items-center gap-2.5 px-3 py-3 text-sm text-ink-900 hover:bg-ink-900/5 rounded-sm text-left"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-dancheong-600" />
                <span className="text-dancheong-700">복사됐어요</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                수정 주소 복사
              </>
            )}
          </button>
          <button
            type="button"
            onClick={clearSecret}
            className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-ink-500 hover:bg-maple-700/5 hover:text-maple-700 rounded-sm text-left mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
            이 기기에서 수정 버튼 숨기기
          </button>
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => {
          setMenuOpen((v) => !v);
          if (!hintDismissed) dismissHint();
        }}
        className="inline-flex items-center gap-2 px-5 py-3 bg-ink-900 text-hanji-50 rounded-full shadow-[0_8px_24px_-8px_rgba(20,17,13,0.4)] hover:bg-ink-700 active:scale-95 transition-all"
        style={{ transitionTimingFunction: "var(--ease-out-apple)" }}
        aria-label={menuOpen ? "수정 메뉴 닫기" : "수정 메뉴 열기"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <>
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">닫기</span>
          </>
        ) : (
          <>
            <Pencil className="w-4 h-4" />
            <span className="text-sm font-medium">수정</span>
          </>
        )}
      </button>
    </div>
  );
}

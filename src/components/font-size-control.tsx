"use client";

import { useEffect, useState } from "react";
import { Type, X } from "lucide-react";

const STORAGE_KEY = "family-trip:font-scale";

/**
 * 어른 친화 — 글씨 크기 3단계.
 * --font-scale CSS 변수만 바꾸므로 모든 rem 기반 텍스트가 비례 확대되고
 * 컨테이너도 함께 reflow → 레이아웃이 깨지지 않는다.
 */
const STEPS: { value: number; label: string; sample: string }[] = [
  { value: 1,     label: "보통",     sample: "가" },
  { value: 1.15,  label: "크게",     sample: "가" },
  { value: 1.32,  label: "더 크게",  sample: "가" },
];

function applyScale(scale: number) {
  document.documentElement.style.setProperty("--font-scale", String(scale));
}

export function FontSizeControl() {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const initial = raw ? Number(raw) : 1;
    if (Number.isFinite(initial) && initial >= 0.8 && initial <= 1.6) {
      setScale(initial);
      applyScale(initial);
    }
  }, []);

  function pick(next: number) {
    setScale(next);
    applyScale(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* noop */
    }
  }

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start gap-2">
      {open && (
        <div className="hanji-card p-2 mb-1 flex flex-col gap-1 min-w-[170px]">
          <p className="text-eyebrow px-2.5 pt-1.5 pb-0.5">글씨 크기</p>
          {STEPS.map((step) => {
            const active = Math.abs(scale - step.value) < 0.01;
            return (
              <button
                key={step.value}
                type="button"
                onClick={() => pick(step.value)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm text-left transition-colors ${
                  active
                    ? "bg-ink-900 text-hanji-50"
                    : "text-ink-900 hover:bg-ink-900/5"
                }`}
              >
                <span className="text-sm font-medium">{step.label}</span>
                <span
                  className="font-serif"
                  style={{ fontSize: `${1 * step.value}rem` }}
                  aria-hidden
                >
                  {step.sample}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-3 bg-hanji-50 text-ink-900 border border-ink-900/20 rounded-full shadow-[0_8px_24px_-8px_rgba(20,17,13,0.25)] hover:bg-hanji-100 active:scale-95 transition-all"
        style={{ transitionTimingFunction: "var(--ease-out-apple)" }}
        aria-label={open ? "글씨 크기 닫기" : "글씨 크기 조절"}
        aria-expanded={open}
      >
        {open ? (
          <>
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">닫기</span>
          </>
        ) : (
          <>
            <Type className="w-4 h-4" />
            <span className="text-sm font-medium">글씨 크기</span>
          </>
        )}
      </button>
    </div>
  );
}

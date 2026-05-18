"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useTrip } from "@/lib/swr-client";
import type { ChecklistItem, Trip } from "@/lib/types";

const NAME_KEY = "family-trip:name";
const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

export function ChecklistBoard({ initial }: { initial: Trip }) {
  const { data, mutate } = useTrip(initial);
  const items = data?.checklist ?? [];
  const [name, setName] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(NAME_KEY) ?? "";
    setName(stored);
  }, []);

  function saveName(v: string) {
    setName(v);
    try {
      window.localStorage.setItem(NAME_KEY, v);
    } catch {
      /* noop */
    }
  }

  async function toggle(item: ChecklistItem) {
    const next: ChecklistItem = {
      ...item,
      checked: !item.checked,
      toggledBy: name || item.toggledBy,
      updatedAt: Date.now(),
    };
    const optimistic: Trip = data
      ? {
          ...data,
          checklist: data.checklist.map((c) => (c.id === item.id ? next : c)),
        }
      : initial;
    mutate(optimistic, { revalidate: false });
    try {
      const res = await fetch("/api/trip/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          checked: next.checked,
          toggledBy: name || undefined,
        }),
      });
      if (res.ok) {
        const fresh = (await res.json()) as Trip;
        mutate(fresh, { revalidate: false });
      } else {
        mutate();
      }
    } catch {
      mutate();
    }
  }

  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div className="hanji-card p-6 sm:p-8">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="text-eyebrow">함께 챙길 것</p>
          <p className="text-sm text-ink-700 mt-2 num">
            <span className="font-medium">{doneCount}</span> /{" "}
            <span>{items.length}</span> 완료
          </p>
        </div>
        <label className="text-xs text-ink-600 flex items-center gap-2">
          <span className="hidden sm:inline">내 이름</span>
          <input
            value={name}
            onChange={(e) => saveName(e.target.value)}
            placeholder="이름 (선택)"
            maxLength={20}
            className="px-2.5 py-1.5 bg-hanji-100 border border-ink-900/15 rounded-sm text-sm w-32 focus:outline-none focus:border-ink-900/50 transition-colors"
          />
        </label>
      </header>

      <ul className="divide-y divide-ink-900/8">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: APPLE_EASE }}
            >
              <button
                type="button"
                onClick={() => toggle(item)}
                className="w-full flex items-center gap-3.5 py-3 hover:bg-ink-900/[0.025] -mx-2 px-2 rounded-sm transition-colors text-left group"
                aria-pressed={item.checked}
              >
                <span
                  className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center rounded-sm transition-all duration-300 ${
                    item.checked
                      ? "bg-ink-900 border-ink-900"
                      : "border-ink-900/30 group-hover:border-ink-900/60"
                  }`}
                  aria-hidden
                >
                  {item.checked && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, ease: "backOut" }}
                    >
                      <Check className="w-3.5 h-3.5 text-hanji-50" strokeWidth={3} />
                    </motion.span>
                  )}
                </span>
                <span
                  className={`flex-1 text-sm sm:text-base ${
                    item.checked ? "line-through text-ink-400" : "text-ink-900"
                  }`}
                >
                  {item.text}
                </span>
                {item.checked && item.toggledBy && (
                  <span className="brush text-base text-ink-500 shrink-0">
                    — {item.toggledBy}
                  </span>
                )}
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {items.length === 0 && (
        <p className="text-center text-ink-500 text-sm py-6">
          체크리스트가 비어 있습니다.
        </p>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBasket } from "lucide-react";
import { useTrip } from "@/lib/swr-client";
import type { Trip, GroceryItem } from "@/lib/types";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

export function GroceryBoard({ initial }: { initial: Trip }) {
  const { data, mutate } = useTrip(initial);
  const trip = data ?? initial;
  const items = trip.groceries;
  const families = trip.families;

  const summary = useMemo(() => {
    const est = items.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
    const act = items
      .filter((i) => i.purchased)
      .reduce((s, i) => s + (i.actualCost ?? i.estimatedCost ?? 0), 0);
    const done = items.filter((i) => i.purchased).length;
    return { est, act, done };
  }, [items]);

  async function togglePurchased(item: GroceryItem) {
    const next = !item.purchased;
    // optimistic
    const optimistic: Trip = {
      ...trip,
      groceries: trip.groceries.map((g) =>
        g.id === item.id ? { ...g, purchased: next } : g,
      ),
    };
    mutate(optimistic, { revalidate: false });
    try {
      const res = await fetch("/api/trip/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, purchased: next }),
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

  return (
    <div className="hanji-card p-6 sm:p-8">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="text-eyebrow">함께 사올 것</p>
          <p className="text-sm text-ink-700 mt-2">
            <span className="num font-medium">{summary.done}</span> /{" "}
            <span className="num">{items.length}</span> 구매 완료
          </p>
        </div>
        <div className="text-right">
          <p className="text-eyebrow mb-1">예상</p>
          <p className="font-serif num text-lg text-ink-900">
            ₩ {formatKRW(summary.est)}
          </p>
          {summary.act > 0 && (
            <p className="text-caption mt-1 num">
              지출 ₩ {formatKRW(summary.act)}
            </p>
          )}
        </div>
      </header>

      <ul className="divide-y divide-ink-900/8">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const family = families.find((f) => f.id === item.assignedFamilyId);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: APPLE_EASE }}
                className="py-3"
              >
                <button
                  type="button"
                  onClick={() => togglePurchased(item)}
                  className="w-full flex items-center gap-3.5 text-left group"
                  aria-pressed={item.purchased}
                >
                  <span
                    className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center rounded-sm transition-all duration-300 ${
                      item.purchased
                        ? "bg-dancheong-600 border-dancheong-600"
                        : "border-ink-900/30 group-hover:border-ink-900/60"
                    }`}
                    aria-hidden
                  >
                    {item.purchased && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, ease: "backOut" }}
                      >
                        <Check className="w-3.5 h-3.5 text-hanji-50" strokeWidth={3} />
                      </motion.span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-sm sm:text-base ${
                        item.purchased ? "line-through text-ink-400" : "text-ink-900"
                      }`}
                    >
                      {item.text}
                    </span>
                    <span className="text-xs text-ink-500 mt-0.5 inline-flex items-center gap-2">
                      {family && (
                        <span className="text-ink-600">@ {family.label}</span>
                      )}
                      {item.note && <span>· {item.note}</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {item.actualCost != null ? (
                      <span className="block text-sm font-serif num text-ink-900">
                        ₩ {formatKRW(item.actualCost)}
                      </span>
                    ) : item.estimatedCost != null ? (
                      <span className="block text-sm font-serif num text-ink-500">
                        예상 ₩ {formatKRW(item.estimatedCost)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {items.length === 0 && (
        <p className="text-center text-ink-500 text-sm py-6 inline-flex items-center justify-center gap-2 w-full">
          <ShoppingBasket className="w-4 h-4" />
          장보기 항목이 비어 있습니다.
        </p>
      )}
    </div>
  );
}


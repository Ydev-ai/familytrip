"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useTrip } from "@/lib/swr-client";
import type { Trip } from "@/lib/types";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

function fmt(n: number): string {
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? "-" : "";
  return `${sign}₩ ${new Intl.NumberFormat("ko-KR").format(abs)}`;
}

export function BudgetBoard({ initial }: { initial: Trip }) {
  const { data } = useTrip(initial);
  const trip = data ?? initial;
  const { budget, families } = trip;

  const stats = useMemo(() => {
    const paidByFamily = new Map<string, number>();
    let totalIn = 0;
    for (const p of budget.payments) {
      paidByFamily.set(p.familyId, (paidByFamily.get(p.familyId) ?? 0) + p.amount);
      totalIn += p.amount;
    }
    const totalOut = budget.expenses.reduce((s, e) => s + e.amount, 0);
    const balance = totalIn - totalOut;
    const totalHeadcount = families.reduce(
      (s, f) => s + Math.max(f.headcount, f.members.length),
      0,
    );
    const expectedTotal = (budget.perPerson ?? 0) * totalHeadcount;
    return { paidByFamily, totalIn, totalOut, balance, expectedTotal, totalHeadcount };
  }, [budget, families]);

  return (
    <div className="space-y-5">
      {/* Top stat row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="회비 모임"
          value={fmt(stats.totalIn)}
          sub={
            budget.perPerson
              ? `예상 ${fmt(stats.expectedTotal)}`
              : `${stats.totalHeadcount}명 기준`
          }
          icon={<TrendingUp className="w-4 h-4" />}
          tint="dancheong"
        />
        <StatCard
          label="지출"
          value={fmt(stats.totalOut)}
          sub={`${budget.expenses.length}건`}
          icon={<TrendingDown className="w-4 h-4" />}
          tint="maple"
        />
        <StatCard
          label="잔액"
          value={fmt(stats.balance)}
          sub={stats.balance >= 0 ? "여유분" : "초과분"}
          icon={<Wallet className="w-4 h-4" />}
          tint={stats.balance >= 0 ? "gold" : "maple"}
          emphasize
        />
      </div>

      {/* Note */}
      {budget.note && (
        <p className="text-caption italic text-center">{budget.note}</p>
      )}

      {/* Family-by-family payments */}
      <div className="hanji-card p-6 sm:p-7">
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg text-ink-900 tracking-tight">
            가족별 납부 현황
          </h3>
          {budget.perPerson != null && (
            <p className="text-caption">
              1인당 권장{" "}
              <span className="font-medium text-ink-700 num">
                ₩ {new Intl.NumberFormat("ko-KR").format(budget.perPerson)}
              </span>
            </p>
          )}
        </header>
        <ul className="divide-y divide-ink-900/8">
          {families.map((family, idx) => {
            const head = Math.max(family.headcount, family.members.length);
            const expected = (budget.perPerson ?? 0) * head;
            const paid = stats.paidByFamily.get(family.id) ?? 0;
            const ratio = expected > 0 ? Math.min(1, paid / expected) : paid > 0 ? 1 : 0;
            const remaining = expected - paid;
            return (
              <li key={family.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-ink-900 tracking-tight">
                      {family.label}
                      <span className="text-ink-500 text-xs ml-2 num">{head}명</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif num text-ink-900">{fmt(paid)}</p>
                    {expected > 0 && (
                      <p className="text-caption num">
                        / {fmt(expected)}
                      </p>
                    )}
                  </div>
                </div>
                {expected > 0 && (
                  <div className="mt-2 h-1 bg-ink-900/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ duration: 0.7, delay: idx * 0.04, ease: APPLE_EASE }}
                      className={`h-full ${ratio >= 1 ? "bg-dancheong-600" : "bg-ink-700"}`}
                    />
                  </div>
                )}
                {expected > 0 && remaining > 0 && (
                  <p className="text-[11px] text-ink-500 mt-1 num">
                    잔여 {fmt(remaining)}
                  </p>
                )}
              </li>
            );
          })}
          {families.length === 0 && (
            <li className="text-sm italic text-ink-500 py-3">가족 정보 없음</li>
          )}
        </ul>
      </div>

      {/* Expenses */}
      {budget.expenses.length > 0 && (
        <div className="hanji-card p-6 sm:p-7">
          <h3 className="font-serif text-lg text-ink-900 mb-4 tracking-tight">
            지출 내역
          </h3>
          <ul className="divide-y divide-ink-900/8">
            {budget.expenses.map((exp) => {
              const payer = families.find((f) => f.id === exp.paidByFamilyId);
              return (
                <li key={exp.id} className="py-3 flex items-baseline gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-900">{exp.title}</p>
                    <p className="text-caption mt-0.5">
                      {exp.category && (
                        <span className="text-ink-600">{exp.category}</span>
                      )}
                      {exp.occurredAt && <span> · {exp.occurredAt}</span>}
                      {payer && <span> · {payer.label} 결제</span>}
                      {exp.note && <span> · {exp.note}</span>}
                    </p>
                  </div>
                  <p className="font-serif num text-ink-900 shrink-0">
                    {fmt(exp.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tint,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tint: "dancheong" | "maple" | "gold" | "ink";
  emphasize?: boolean;
}) {
  const tintMap = {
    dancheong: "text-dancheong-700",
    maple: "text-maple-700",
    gold: "text-gold-600",
    ink: "text-ink-700",
  };
  return (
    <div
      className={`hanji-card p-5 ${emphasize ? "ring-1 ring-ink-900/10" : ""}`}
    >
      <p className={`text-eyebrow flex items-center gap-1.5 ${tintMap[tint]}`}>
        {icon}
        {label}
      </p>
      <p
        className={`font-serif num mt-2 tracking-tight ${
          emphasize ? "text-3xl text-ink-900" : "text-2xl text-ink-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-caption mt-1 num">{sub}</p>}
    </div>
  );
}

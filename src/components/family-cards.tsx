"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, Clock, Circle } from "lucide-react";
import { useTrip } from "@/lib/swr-client";
import type { Family, FamilyColor, RsvpStatus, Trip } from "@/lib/types";
import { familyInitial, nextRsvp, totalHeadcount } from "@/lib/family";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;
const NAME_KEY = "family-trip:name";

const colorClass: Record<
  FamilyColor,
  { border: string; bg: string; dot: string; tint: string; ring: string; avatar: string }
> = {
  ink:       { border: "border-ink-900/20",       bg: "bg-ink-900/[0.03]",      dot: "bg-ink-900",       tint: "text-ink-900",       ring: "ring-ink-900/15",       avatar: "bg-ink-900 text-hanji-50" },
  dancheong: { border: "border-dancheong-700/25", bg: "bg-dancheong-700/[0.05]",dot: "bg-dancheong-600", tint: "text-dancheong-700", ring: "ring-dancheong-600/20", avatar: "bg-dancheong-600 text-hanji-50" },
  maple:     { border: "border-maple-700/25",    bg: "bg-maple-700/[0.05]",    dot: "bg-maple-600",     tint: "text-maple-700",     ring: "ring-maple-600/20",     avatar: "bg-maple-600 text-hanji-50" },
  gold:      { border: "border-gold-500/40",     bg: "bg-gold-500/[0.07]",     dot: "bg-gold-500",      tint: "text-gold-600",      ring: "ring-gold-500/25",      avatar: "bg-gold-500 text-ink-900" },
  celadon:   { border: "border-celadon-500/30",  bg: "bg-celadon-500/[0.06]",  dot: "bg-celadon-600",   tint: "text-celadon-600",   ring: "ring-celadon-500/20",   avatar: "bg-celadon-600 text-hanji-50" },
  plum:      { border: "border-plum-500/30",     bg: "bg-plum-500/[0.06]",     dot: "bg-plum-500",      tint: "text-plum-600",      ring: "ring-plum-500/20",      avatar: "bg-plum-500 text-hanji-50" },
};

export function FamilyCards({ initial }: { initial: Trip }) {
  const { data, mutate } = useTrip(initial);
  const trip = data ?? initial;
  const families = trip.families;
  const [name, setName] = useState("");

  useEffect(() => {
    setName(window.localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  async function toggleRsvp(family: Family) {
    const next = nextRsvp(family.rsvp);
    const optimistic: Trip = {
      ...trip,
      families: trip.families.map((f) =>
        f.id === family.id
          ? { ...f, rsvp: next, rsvpBy: name || f.rsvpBy, rsvpAt: Date.now() }
          : f,
      ),
    };
    mutate(optimistic, { revalidate: false });
    try {
      const res = await fetch("/api/trip/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: family.id,
          rsvp: next,
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

  if (families.length === 0) {
    return (
      <div className="hanji-card p-10 text-center">
        <p className="text-ink-500 text-sm">참석 가족 정보가 아직 등록되지 않았습니다.</p>
      </div>
    );
  }

  const total = totalHeadcount(families);
  const confirmedCount = families.filter((f) => f.rsvp === "confirmed").length;
  const confirmedPeople = families
    .filter((f) => f.rsvp === "confirmed")
    .reduce((s, f) => s + Math.max(f.headcount, f.members.length), 0);

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div className="space-y-1.5">
          <p className="text-sm text-ink-600 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              총 <strong className="font-medium text-ink-900 num">{families.length}</strong> 가족 ·{" "}
              <strong className="font-medium text-ink-900 num">{total}</strong> 명
            </span>
          </p>
          <p className="text-caption num">
            도착 확정{" "}
            <strong className="text-dancheong-700 font-medium">
              {confirmedCount}
            </strong>{" "}
            / {families.length} 가족 ·{" "}
            <strong className="text-dancheong-700 font-medium">
              {confirmedPeople}
            </strong>{" "}
            명
          </p>
        </div>
        <label className="text-xs text-ink-600 flex items-center gap-2">
          <span className="hidden sm:inline">내 이름 (RSVP 누를 때 기록)</span>
          <span className="sm:hidden">내 이름</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              try {
                window.localStorage.setItem(NAME_KEY, e.target.value);
              } catch {
                /* noop */
              }
            }}
            placeholder="예: 혜숙"
            maxLength={20}
            className="px-2.5 py-1.5 bg-hanji-100 border border-ink-900/15 rounded-sm text-sm w-32 focus:outline-none focus:border-ink-900/50 transition-colors"
          />
        </label>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((family, idx) => (
          <FamilyCard
            key={family.id}
            family={family}
            idx={idx}
            onToggleRsvp={() => toggleRsvp(family)}
          />
        ))}
      </div>
    </div>
  );
}

function FamilyCard({
  family,
  idx,
  onToggleRsvp,
}: {
  family: Family;
  idx: number;
  onToggleRsvp: () => void;
}) {
  const c = colorClass[family.color ?? "ink"];
  const namesShown = family.members.length;
  const headcount = Math.max(family.headcount, namesShown);
  const initial = familyInitial(family.label);
  const status: RsvpStatus = family.rsvp ?? "pending";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.55, delay: idx * 0.05, ease: APPLE_EASE }}
      className={`hanji-card hanji-card-hover p-5 sm:p-6 border ${c.border} ${c.bg} flex flex-col`}
    >
      <header className="flex items-start gap-3.5">
        {/* Avatar */}
        <div
          className={`shrink-0 w-12 h-12 rounded-full ring-2 ${c.ring} overflow-hidden relative`}
        >
          {family.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={family.photoUrl}
              alt={family.label}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center font-serif text-base font-medium tracking-tight ${c.avatar}`}
            >
              {initial}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl text-ink-900 tracking-tight leading-tight truncate">
            {family.label}
          </h3>
          <p className={`text-xs num mt-0.5 ${c.tint}`}>
            {headcount}명
          </p>
        </div>

        <RsvpBadge status={status} onClick={onToggleRsvp} />
      </header>

      <div className="ink-divider-soft my-4" />

      <ul className="space-y-1.5 flex-1">
        {family.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 text-sm text-ink-800"
          >
            <span className="truncate">
              {m.name || <span className="text-ink-400">—</span>}
            </span>
            {m.note && (
              <span className="text-xs text-ink-500 shrink-0 truncate max-w-[8rem]">
                {m.note}
              </span>
            )}
          </li>
        ))}
        {namesShown === 0 && family.headcount > 0 && (
          <li className="text-xs text-ink-400 italic">이름 미입력 · {family.headcount}명</li>
        )}
        {namesShown > 0 && namesShown < family.headcount && (
          <li className="text-xs text-ink-400 italic">
            + {family.headcount - namesShown}명 미기입
          </li>
        )}
      </ul>

      {(family.arrivalNote || (status === "confirmed" && family.rsvpBy)) && (
        <div className="mt-4 pt-3 border-t border-ink-900/10 space-y-1.5">
          {family.arrivalNote && (
            <p className="text-xs text-ink-600">⌚︎ {family.arrivalNote}</p>
          )}
          {status === "confirmed" && family.rsvpBy && (
            <p className="brush text-base text-dancheong-700">
              — {family.rsvpBy}
            </p>
          )}
        </div>
      )}
    </motion.article>
  );
}

function RsvpBadge({
  status,
  onClick,
}: {
  status: RsvpStatus;
  onClick: () => void;
}) {
  const style: Record<
    RsvpStatus,
    { bg: string; text: string; border: string; icon: React.ReactNode; label: string }
  > = {
    confirmed: {
      bg: "bg-dancheong-700",
      text: "text-hanji-50",
      border: "border-dancheong-700",
      icon: <Check className="w-3 h-3" strokeWidth={3} />,
      label: "도착 확정",
    },
    tentative: {
      bg: "bg-gold-500/15",
      text: "text-gold-600",
      border: "border-gold-500/50",
      icon: <Clock className="w-3 h-3" />,
      label: "조정 중",
    },
    pending: {
      bg: "bg-hanji-100",
      text: "text-ink-500",
      border: "border-ink-900/20",
      icon: <Circle className="w-2.5 h-2.5" />,
      label: "응답 대기",
    },
  };
  const s = style[status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium tracking-tight border rounded-full transition-all hover:scale-105 active:scale-95 ${s.bg} ${s.text} ${s.border}`}
      aria-label={`RSVP 상태: ${s.label} — 클릭해서 다음 상태로`}
      title="클릭해서 도착 확정 / 조정 중 / 응답 대기로 전환"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ y: 4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -4, opacity: 0 }}
          transition={{ duration: 0.18, ease: APPLE_EASE }}
          className="inline-flex items-center gap-1"
        >
          {s.icon}
          {s.label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

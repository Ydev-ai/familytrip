"use client";

import { motion } from "framer-motion";
import type { ScheduleItem } from "@/lib/types";
import { InkNightScene, InkMorningScene } from "./ink-art";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

export function ScheduleTimeline({ items }: { items: ScheduleItem[] }) {
  const day1 = items.filter((i) => i.day === 1);
  const day2 = items.filter((i) => i.day === 2);
  return (
    <div className="grid gap-12 md:gap-16 md:grid-cols-2">
      <DayColumn day={1} label="첫째 날" subtitle="5월 24일 일요일" items={day1} />
      <DayColumn day={2} label="둘째 날" subtitle="5월 25일 월요일" items={day2} />
    </div>
  );
}

function DayColumn({
  day,
  label,
  subtitle,
  items,
}: {
  day: number;
  label: string;
  subtitle: string;
  items: ScheduleItem[];
}) {
  const Art = day === 1 ? InkNightScene : InkMorningScene;
  return (
    <section aria-labelledby={`day-${day}-heading`}>
      <div className="mb-3 relative h-20 overflow-hidden rounded-sm">
        <Art className="text-ink-900 absolute inset-0 w-full h-full opacity-80" />
      </div>
      <header className="mb-7 flex items-baseline gap-4">
        <span
          className="font-serif text-5xl text-maple-700/85 leading-none select-none num"
          aria-hidden
        >
          {day === 1 ? "Ⅰ" : "Ⅱ"}
        </span>
        <div>
          <h3
            id={`day-${day}-heading`}
            className="text-headline text-ink-900"
          >
            {label}
          </h3>
          <p className="text-caption mt-1">{subtitle}</p>
        </div>
      </header>
      <ol className="relative space-y-1 pl-7 before:absolute before:left-[9px] before:top-3 before:bottom-3 before:w-px before:bg-ink-900/25">
        {items.length === 0 && (
          <li className="text-caption italic">일정이 비어 있습니다.</li>
        )}
        {items.map((item, idx) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{
              duration: 0.55,
              delay: idx * 0.06,
              ease: APPLE_EASE,
            }}
            className="relative py-3.5"
          >
            <span
              className="absolute -left-[20px] top-[22px] w-[10px] h-[10px] rounded-full bg-ink-900 ring-[3px] ring-hanji-50"
              aria-hidden
            />
            <div className="flex items-baseline gap-3.5">
              {item.time && (
                <time className="font-serif num text-ink-700 text-sm font-medium tracking-tight min-w-[3.5rem] tabular-nums">
                  {item.time}
                </time>
              )}
              <h4 className="text-title text-ink-900">{item.title}</h4>
            </div>
            {item.description && (
              <p className="mt-1.5 ml-[4.7rem] text-ink-600 text-sm leading-relaxed">
                {item.description}
              </p>
            )}
            {item.location && (
              <p className="mt-1 ml-[4.7rem] text-caption">@ {item.location}</p>
            )}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

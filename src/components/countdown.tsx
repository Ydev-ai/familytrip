"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
}

function diff(target: number): Parts {
  const now = Date.now();
  const delta = Math.max(0, target - now);
  const done = delta === 0;
  const d = Math.floor(delta / 86_400_000);
  const h = Math.floor((delta % 86_400_000) / 3_600_000);
  const m = Math.floor((delta % 3_600_000) / 60_000);
  const s = Math.floor((delta % 60_000) / 1000);
  return { d, h, m, s, done };
}

export function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(diff(target));
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!parts) {
    return <div className="h-[3.5rem]" aria-hidden />;
  }

  if (parts.done) {
    return (
      <p className="brush text-3xl sm:text-4xl text-maple-700">지금, 모두 여기에.</p>
    );
  }

  return (
    <div
      className="inline-flex items-baseline gap-3 sm:gap-4 text-ink-900"
      aria-label={`출발까지 ${parts.d}일 ${parts.h}시간 ${parts.m}분 ${parts.s}초`}
    >
      <Unit value={parts.d} label="일" big primary />
      <Sep />
      <Unit value={parts.h} label="시" />
      <Sep small />
      <Unit value={parts.m} label="분" />
      <Sep small />
      <Unit value={parts.s} label="초" muted />
    </div>
  );
}

function Sep({ small }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`text-ink-200 ${small ? "text-base" : "text-2xl"}`}
    >
      ·
    </span>
  );
}

function Unit({
  value,
  label,
  big,
  muted,
  primary,
}: {
  value: number;
  label: string;
  big?: boolean;
  muted?: boolean;
  primary?: boolean;
}) {
  const padded = String(value).padStart(2, "0");
  return (
    <span
      className={`inline-flex items-baseline ${
        muted ? "opacity-50 text-base" : big ? "text-5xl sm:text-6xl" : "text-2xl sm:text-3xl"
      }`}
    >
      <span
        className={`font-serif num ${primary ? "font-medium" : ""} relative inline-block`}
        style={{ minWidth: big ? "1.5em" : "1.4em" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={padded}
            initial={{ y: "0.55em", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-0.55em", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="inline-block"
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </span>
      <span
        className={`ml-1 text-ink-500 ${big ? "text-base sm:text-lg" : "text-xs sm:text-sm"} font-medium`}
      >
        {label}
      </span>
    </span>
  );
}

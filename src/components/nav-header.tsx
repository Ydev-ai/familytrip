"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  kanji: string;
}

const ITEMS: NavItem[] = [
  { id: "place",     label: "장소",       kanji: "所" },
  { id: "schedule",  label: "일정",       kanji: "日" },
  { id: "families",  label: "가족",       kanji: "家" },
  { id: "groceries", label: "장보기",     kanji: "市" },
  // { id: "budget",    label: "회비",       kanji: "金" }, // 회비 섹션 숨김 — 추후 다시 노출
  { id: "checklist", label: "준비물",     kanji: "備" },
];

export function NavHeader({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75] },
    );
    ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleJump(id: string) {
    setOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-hanji-100/80 backdrop-blur-xl border-b border-ink-900/8"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{ transitionTimingFunction: "var(--ease-out-apple)" }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleJump("top")}
            className="font-serif text-ink-900 text-sm sm:text-base tracking-tight hover:opacity-70 transition-opacity"
          >
            {title}
          </button>
          <nav className="hidden md:flex items-center gap-1" aria-label="섹션 이동">
            {ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleJump(item.id)}
                  className={`relative px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors ${
                    isActive
                      ? "text-ink-900"
                      : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 -bottom-px h-px bg-ink-900"
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden -mr-2 p-2 text-ink-900 hover:opacity-70 transition-opacity"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-30 md:hidden bg-hanji-100/95 backdrop-blur-2xl pt-14"
          >
            <nav
              className="max-w-md mx-auto px-6 py-10 grid gap-1"
              aria-label="섹션 이동 (모바일)"
            >
              {ITEMS.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.04 + idx * 0.04,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                  type="button"
                  onClick={() => handleJump(item.id)}
                  className="flex items-baseline justify-between py-4 border-b border-ink-900/10 text-left group"
                >
                  <span className="font-serif text-2xl text-ink-900 group-hover:text-maple-700 transition-colors">
                    {item.label}
                  </span>
                  <span className="font-serif text-3xl text-maple-700/40 group-hover:text-maple-700/80 transition-colors">
                    {item.kanji}
                  </span>
                </motion.button>
              ))}
              <p className="text-eyebrow mt-8 text-ink-400">家族旅行 · 2026</p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

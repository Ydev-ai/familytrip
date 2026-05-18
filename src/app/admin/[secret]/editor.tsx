"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Check,
  AlertCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import type {
  Trip,
  ScheduleItem,
  Family,
  ChecklistItem,
  FamilyMember,
  FamilyColor,
  GroceryItem,
  DuePayment,
  Expense,
  RsvpStatus,
} from "@/lib/types";
import { extractIframeSrc } from "@/lib/embed";
import {
  isoToLocalInput,
  localInputToIso,
  isoToKoreanPreview,
} from "@/lib/datetime";

type Status = "idle" | "saving" | "saved" | "error";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const FAMILY_COLORS: FamilyColor[] = [
  "ink",
  "dancheong",
  "maple",
  "gold",
  "celadon",
  "plum",
];

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "pending", label: "응답 대기" },
  { value: "confirmed", label: "도착 확정" },
  { value: "tentative", label: "조정 중" },
];

const EXPENSE_CATEGORIES: NonNullable<Expense["category"]>[] = [
  "식료품",
  "숙박",
  "교통",
  "기타",
];

/**
 * Admin 좌측 sidebar (데스크탑) · 상단 가로 tab bar (모바일) 구성.
 * 한 번에 한 섹션만 풀스크린으로 편집 — Apple Settings / Linear 톤.
 */
type SectionId =
  | "copy"
  | "date"
  | "place"
  | "schedule"
  | "families"
  | "groceries"
  | "checklist";

interface SectionDef {
  id: SectionId;
  label: string;
  kanji: string;
  caption: string;
}

const SECTIONS: SectionDef[] = [
  { id: "copy",      label: "첫 화면 글", kanji: "序", caption: "제목 · 부제 · 인사말" },
  { id: "date",      label: "날짜와 시간", kanji: "日", caption: "시작 · 종료" },
  { id: "place",     label: "모이는 곳",   kanji: "所", caption: "주소 · 지도" },
  { id: "schedule",  label: "1박 2일 일정",kanji: "時", caption: "시간표" },
  { id: "families",  label: "참석 가족",   kanji: "家", caption: "인원 · 도착 확인" },
  { id: "groceries", label: "함께 사올 것",kanji: "市", caption: "장보기 분담" },
  // { id: "budget",    label: "회비 · 지출", kanji: "金", caption: "납부·지출" }, // 회비 섹션 숨김 — 추후 다시 노출
  { id: "checklist", label: "챙길 것",     kanji: "備", caption: "준비물" },
];

export function AdminEditor({
  initial,
  adminKey,
}: {
  initial: Trip;
  adminKey: string;
}) {
  const [draft, setDraft] = useState<Trip>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeId, setActiveId] = useState<SectionId>("copy");
  const [, startTransition] = useTransition();

  function set<K extends keyof Trip>(key: K, value: Trip[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/trip", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`save failed: ${res.status} ${text}`);
      }
      const saved = (await res.json()) as Trip;
      startTransition(() => setDraft(saved));
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }

  const activeSection =
    SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

  /** 활성 섹션에 따라 한 번에 한 폼만 렌더 — Apple Settings 톤.
   *  switch 로 명시적으로 활성 panel 만 평가해서 React 가 children 변경을 확실히 감지. */
  function renderActivePanel(): React.ReactNode {
    switch (activeId) {
      case "copy":
        return copyPanel;
      case "date":
        return datePanel;
      case "place":
        return placePanel;
      case "schedule":
        return (
          <ScheduleEditor
            items={draft.schedule}
            onChange={(items) => set("schedule", items)}
          />
        );
      case "families":
        return (
          <FamiliesEditor
            families={draft.families}
            onChange={(families) => set("families", families)}
          />
        );
      case "groceries":
        return (
          <GroceryEditor
            items={draft.groceries}
            families={draft.families}
            onChange={(items) => set("groceries", items)}
          />
        );
      case "checklist":
        return (
          <ChecklistEditor
            items={draft.checklist}
            onChange={(items) => set("checklist", items)}
          />
        );
    }
  }

  const copyPanel = (
      <Panel section={activeSection}>
        <Field label="제목" hint="예: 우리 가족 1박 2일">
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            className="ed-input"
          />
        </Field>
        <Field label="부제" hint="장소나 모임 한 줄 설명">
          <input
            value={draft.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className="ed-input"
            placeholder="예: 어반스트림에서"
          />
        </Field>
        <Field
          label="인사말"
          hint="페이지 중간에 손글씨로 크게 보이는 한 마디예요."
        >
          <input
            value={draft.hero.headline}
            onChange={(e) =>
              set("hero", { ...draft.hero, headline: e.target.value })
            }
            className="ed-input"
            placeholder="예: 오랜만에, 한자리에."
          />
        </Field>
        <Field label="설명 한 줄" hint="인사말 밑에 작게 들어가는 안내문이에요.">
          <textarea
            value={draft.hero.sub ?? ""}
            onChange={(e) =>
              set("hero", { ...draft.hero, sub: e.target.value })
            }
            className="ed-input"
            rows={2}
            placeholder="예: 다 같이 모여 밥 먹고, 게임 하고, 산책 한 번 합시다."
          />
        </Field>
      </Panel>
    );

  const datePanel = (
      <Panel section={activeSection}>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="시작" hint="모임이 시작되는 시각">
            <input
              type="datetime-local"
              value={isoToLocalInput(draft.startsAt)}
              onChange={(e) =>
                set(
                  "startsAt",
                  localInputToIso(e.target.value) || draft.startsAt,
                )
              }
              className="ed-input"
            />
            {draft.startsAt && (
              <p className="text-xs text-ink-500 mt-2 num">
                ▸ {isoToKoreanPreview(draft.startsAt)}
              </p>
            )}
          </Field>
          <Field label="종료" hint="모임이 끝나는 시각">
            <input
              type="datetime-local"
              value={isoToLocalInput(draft.endsAt)}
              onChange={(e) =>
                set("endsAt", localInputToIso(e.target.value) || draft.endsAt)
              }
              className="ed-input"
            />
            {draft.endsAt && (
              <p className="text-xs text-ink-500 mt-2 num">
                ▸ {isoToKoreanPreview(draft.endsAt)}
              </p>
            )}
          </Field>
        </div>
      </Panel>
    );

  const placePanel = (
      <Panel section={activeSection}>
        <Field label="장소 이름" hint="예: 어반스트림">
          <input
            value={draft.place.name}
            onChange={(e) =>
              set("place", { ...draft.place, name: e.target.value })
            }
            className="ed-input"
          />
        </Field>
        <Field label="주소" hint="도로명 주소 그대로 넣으시면 됩니다.">
          <input
            value={draft.place.address ?? ""}
            onChange={(e) =>
              set("place", { ...draft.place, address: e.target.value })
            }
            className="ed-input"
          />
        </Field>
        <Field
          label="좌표 (선택)"
          hint="비워두면 주소로 자동 검색됩니다. 정확히 핀을 찍고 싶으면 카카오맵 좌표를 옮겨 적으세요."
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="number"
              step="0.000001"
              value={draft.place.lat ?? ""}
              onChange={(e) =>
                set("place", {
                  ...draft.place,
                  lat: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="ed-input num"
              placeholder="위도 (예: 37.485)"
            />
            <input
              type="number"
              step="0.000001"
              value={draft.place.lng ?? ""}
              onChange={(e) =>
                set("place", {
                  ...draft.place,
                  lng: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="ed-input num"
              placeholder="경도 (예: 127.310)"
            />
          </div>
        </Field>
        <Field
          label="지도 링크 (선택)"
          hint="카카오맵 장소 페이지 주소를 그대로 넣으면 '카카오맵' 버튼이 그쪽으로 이어집니다."
        >
          <input
            value={draft.place.mapUrl ?? ""}
            onChange={(e) =>
              set("place", { ...draft.place, mapUrl: e.target.value })
            }
            className="ed-input"
            placeholder="https://map.kakao.com/..."
          />
        </Field>
        <Field
          label="지도 직접 보여주기 (선택)"
          hint="페이지 안에 카카오 지도를 그대로 띄우고 싶을 때 사용합니다."
        >
          <details className="text-xs text-ink-600 mb-2 bg-hanji-100/60 border border-ink-900/12 rounded-md overflow-hidden">
            <summary className="cursor-pointer px-3 py-2.5 hover:bg-hanji-100 font-medium text-ink-800">
              어떻게 하나요? (눌러서 자세히 보기)
            </summary>
            <ol className="px-5 pb-3 pt-1 space-y-1 list-decimal list-outside leading-relaxed">
              <li>카카오맵 PC 사이트에서 어반스트림을 검색합니다.</li>
              <li>오른쪽 정보창 위 <strong>공유</strong> 버튼을 누릅니다.</li>
              <li>
                <strong>외부 사이트에 지도 넣기</strong>를 선택하고 코드를 복사합니다.
              </li>
              <li>아래 칸에 그대로 붙여넣어 주세요. 주소(src)만 자동으로 추출됩니다.</li>
            </ol>
          </details>
          <textarea
            value={draft.place.embedSrc ?? ""}
            onChange={(e) =>
              set("place", {
                ...draft.place,
                embedSrc: extractIframeSrc(e.target.value),
              })
            }
            className="ed-input font-mono text-xs"
            rows={3}
            placeholder='<iframe src="..." ...></iframe>'
          />
          {draft.place.embedSrc && (
            <p className="text-xs text-dancheong-700 mt-2 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              지도 코드가 적용되었어요
            </p>
          )}
        </Field>
      </Panel>
    );

  return (
    <div className="admin-shell">
      <TopBar status={status} errorMsg={errorMsg} onSave={save} />

      <div className="grid md:grid-cols-[260px_1fr] gap-6 md:gap-10 mt-6">
        <SectionNav activeId={activeId} onSelect={setActiveId} />
        <main className="min-w-0">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            {renderActivePanel()}
          </motion.div>
        </main>
      </div>

      <style>{`
        .ed-input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          background: var(--hanji-50);
          border: 1px solid rgba(20, 17, 13, 0.18);
          border-radius: 6px;
          font-family: var(--font-serif);
          font-size: 1rem;
          color: var(--ink-900);
          transition: border-color 0.18s var(--ease-out-apple),
                      background 0.18s var(--ease-out-apple);
        }
        .ed-input:focus {
          outline: none;
          border-color: var(--ink-900);
          background: #ffffff;
        }
        .ed-input::placeholder { color: rgba(70, 61, 49, 0.42); }
        .ed-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 0.85rem; font-size: 0.875rem;
          background: var(--hanji-100); color: var(--ink-900);
          border: 1px solid rgba(20, 17, 13, 0.18);
          border-radius: 6px;
          transition: background 0.18s var(--ease-out-apple);
        }
        .ed-btn:hover { background: var(--hanji-200); }
        .ed-btn-danger { color: var(--maple-700); border-color: rgba(168, 58, 37, 0.3); }
        .ed-btn-danger:hover { background: rgba(168, 58, 37, 0.06); }
        .ed-row { display: flex; gap: 0.5rem; align-items: center; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────── TopBar (sticky 저장 헤더) */

function TopBar({
  status,
  errorMsg,
  onSave,
}: {
  status: Status;
  errorMsg: string;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3.5 bg-hanji-100/85 backdrop-blur-xl border-b border-ink-900/10 flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-baseline gap-3 sm:gap-4">
        <span className="brush text-xl sm:text-2xl text-maple-700 -rotate-1 shrink-0">
          ✎ 수정
        </span>
        <p className="text-sm truncate min-w-0 hidden sm:block">
          {status === "saved" && (
            <span className="text-dancheong-700 inline-flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" />
              저장되었습니다
            </span>
          )}
          {status === "error" && (
            <span className="text-maple-700 inline-flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4" />
              저장 실패 · {errorMsg}
            </span>
          )}
          {status === "idle" && (
            <span className="text-ink-500">
              바꾼 내용은 <strong className="text-ink-900">저장</strong>을 누르면 반영됩니다.
            </span>
          )}
          {status === "saving" && (
            <span className="text-ink-700">저장 중…</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-ink-700 hover:text-ink-900 hover:bg-ink-900/5 rounded-md transition-colors"
          title="공개 페이지에서 결과 미리보기"
        >
          <Eye className="w-4 h-4" />
          미리보기
        </a>
        <button
          type="button"
          onClick={onSave}
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-dancheong-700 text-hanji-50 hover:bg-dancheong-600 disabled:opacity-50 rounded-md text-sm sm:text-base font-medium transition-colors shadow-[0_2px_0_rgba(20,17,13,0.1)]"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── SectionNav (sidebar / 가로 tabs) */

function SectionNav({
  activeId,
  onSelect,
}: {
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav aria-label="섹션 이동">
      {/* 모바일: sticky 가로 pill bar */}
      <div className="md:hidden -mx-6 px-6 sticky top-[64px] z-20 bg-hanji-100/85 backdrop-blur-xl py-3 border-b border-ink-900/8">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {SECTIONS.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                aria-pressed={active}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-colors ${
                  active
                    ? "bg-ink-900 text-hanji-50"
                    : "bg-hanji-50 text-ink-700 border border-ink-900/15 hover:bg-hanji-200"
                }`}
              >
                <span className="font-serif">{s.kanji}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 데스크탑: 좌측 sidebar */}
      <ul className="hidden md:flex md:flex-col gap-1 md:sticky md:top-24 self-start">
        {SECTIONS.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-pressed={active}
                className={`group w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-all ${
                  active
                    ? "bg-ink-900 text-hanji-50"
                    : "text-ink-700 hover:bg-ink-900/[0.04] hover:text-ink-900"
                }`}
              >
                <span
                  className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-md font-serif text-xl ${
                    active
                      ? "bg-hanji-50/15 text-hanji-50"
                      : "bg-hanji-50 text-maple-700 border border-ink-900/10"
                  }`}
                  aria-hidden
                >
                  {s.kanji}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium tracking-tight truncate">
                    {s.label}
                  </span>
                  <span
                    className={`block text-xs mt-0.5 truncate ${
                      active ? "text-hanji-200" : "text-ink-500"
                    }`}
                  >
                    {s.caption}
                  </span>
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─────────────────────────────────── Panel (한 섹션 contents wrapper) */

function Panel({
  section,
  children,
}: {
  section: SectionDef;
  children: React.ReactNode;
}) {
  return (
    <section className="hanji-card p-6 sm:p-8 lg:p-10">
      <header className="mb-7 flex items-end gap-4">
        <span
          className="font-serif text-5xl sm:text-6xl text-maple-700/85 leading-none select-none shrink-0"
          aria-hidden
        >
          {section.kanji}
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow">{section.caption}</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1">
            {section.label}
          </h2>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/* ─────────────────────────────────── Field (라벨 + hint + input wrapper) */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm sm:text-base text-ink-900 font-medium mb-1.5">
        {label}
      </span>
      {hint && (
        <span className="block text-xs sm:text-sm text-ink-500 mb-2 leading-relaxed">
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

/* ─────────────────────────────────── Schedule */

function ScheduleEditor({
  items,
  onChange,
}: {
  items: ScheduleItem[];
  onChange: (items: ScheduleItem[]) => void;
}) {
  function add(day: 1 | 2) {
    onChange([
      ...items,
      { id: uid(), day, time: "", title: "새 일정", description: "" },
    ]);
  }
  function update(id: string, patch: Partial<ScheduleItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  return (
    <section id="sec-schedule" className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="mb-5 pb-4 border-b border-ink-900/10">
        <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
          1박 2일 일정
        </h2>
        <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
          시간 옆 칸에는 <strong>15:00</strong>처럼 시·분을 적어주세요. 비워두셔도 됩니다.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((d) => {
          const day = d as 1 | 2;
          const dayItems = items.filter((i) => i.day === day);
          return (
            <div key={day}>
              <header className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-ink-900">
                  {day === 1 ? "첫째 날" : "둘째 날"} · {dayItems.length}개
                </h3>
                <button type="button" onClick={() => add(day)} className="ed-btn">
                  <Plus className="w-3.5 h-3.5" />
                  일정 더 넣기
                </button>
              </header>
              <ul className="space-y-3">
                {dayItems.map((it) => (
                  <li
                    key={it.id}
                    className="p-3 border border-ink-900/12 rounded-sm bg-hanji-100/40 space-y-2"
                  >
                    <div className="ed-row">
                      <input
                        value={it.time ?? ""}
                        onChange={(e) => update(it.id, { time: e.target.value })}
                        className="ed-input w-24 num text-sm"
                        placeholder="15:00"
                      />
                      <input
                        value={it.title}
                        onChange={(e) => update(it.id, { title: e.target.value })}
                        className="ed-input flex-1"
                        placeholder="예: 저녁 · 바베큐"
                      />
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="ed-btn ed-btn-danger"
                        aria-label="이 일정 지우기"
                        title="이 일정 지우기"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={it.description ?? ""}
                      onChange={(e) => update(it.id, { description: e.target.value })}
                      className="ed-input"
                      rows={2}
                      placeholder="자세한 설명 (선택)"
                    />
                  </li>
                ))}
                {dayItems.length === 0 && (
                  <li className="text-sm italic text-ink-500">아직 적힌 일정이 없어요</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────── Families */

function FamiliesEditor({
  families,
  onChange,
}: {
  families: Family[];
  onChange: (families: Family[]) => void;
}) {
  function addFamily() {
    onChange([
      ...families,
      {
        id: uid(),
        label: "새 가족",
        color: FAMILY_COLORS[families.length % FAMILY_COLORS.length],
        headcount: 1,
        members: [],
      },
    ]);
  }
  function update(id: string, patch: Partial<Family>) {
    onChange(families.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function remove(id: string) {
    onChange(families.filter((f) => f.id !== id));
  }
  function addMember(familyId: string) {
    const family = families.find((f) => f.id === familyId);
    if (!family) return;
    const member: FamilyMember = { id: uid(), name: "" };
    update(familyId, { members: [...family.members, member] });
  }
  function updateMember(
    familyId: string,
    memberId: string,
    patch: Partial<FamilyMember>,
  ) {
    const family = families.find((f) => f.id === familyId);
    if (!family) return;
    update(familyId, {
      members: family.members.map((m) =>
        m.id === memberId ? { ...m, ...patch } : m,
      ),
    });
  }
  function removeMember(familyId: string, memberId: string) {
    const family = families.find((f) => f.id === familyId);
    if (!family) return;
    update(familyId, {
      members: family.members.filter((m) => m.id !== memberId),
    });
  }

  return (
    <section id="sec-families" className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-ink-900/10">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
            참석 가족
          </h2>
          <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
            가족 이름과 인원수만 적으면 됩니다. 멤버 이름은 안 적어도 괜찮아요.
          </p>
        </div>
        <button type="button" onClick={addFamily} className="ed-btn shrink-0">
          <Plus className="w-3.5 h-3.5" />
          가족 더 만들기
        </button>
      </header>
      <div className="space-y-5">
        {families.map((family) => (
          <div
            key={family.id}
            className="p-4 border border-ink-900/12 rounded-sm bg-hanji-100/40 space-y-3"
          >
            <div className="grid grid-cols-12 gap-2 items-end">
              <label className="col-span-7 sm:col-span-6">
                <span className="block text-xs text-ink-600 mb-1">가족 이름</span>
                <input
                  value={family.label}
                  onChange={(e) => update(family.id, { label: e.target.value })}
                  className="ed-input w-full"
                  placeholder="예: 정하네"
                />
              </label>
              <label className="col-span-5 sm:col-span-2">
                <span className="block text-xs text-ink-600 mb-1">인원</span>
                <input
                  type="number"
                  min={0}
                  value={family.headcount}
                  onChange={(e) =>
                    update(family.id, { headcount: Number(e.target.value) || 0 })
                  }
                  className="ed-input w-full num"
                />
              </label>
              <label className="col-span-9 sm:col-span-3">
                <span className="block text-xs text-ink-600 mb-1">카드 색</span>
                <select
                  value={family.color ?? "ink"}
                  onChange={(e) =>
                    update(family.id, { color: e.target.value as FamilyColor })
                  }
                  className="ed-input w-full"
                >
                  {FAMILY_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => remove(family.id)}
                  className="ed-btn ed-btn-danger w-full justify-center"
                  aria-label="이 가족 지우기"
                  title="이 가족 지우기"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <label className="sm:col-span-2">
                <span className="block text-xs text-ink-600 mb-1">
                  가족 사진 주소 (선택)
                </span>
                <input
                  value={family.photoUrl ?? ""}
                  onChange={(e) =>
                    update(family.id, {
                      photoUrl: e.target.value || undefined,
                    })
                  }
                  className="ed-input text-sm"
                  placeholder="비우면 가족 이름 두 글자로 표시돼요"
                />
              </label>
              <label>
                <span className="block text-xs text-ink-600 mb-1">도착 확인</span>
                <select
                  value={family.rsvp ?? "pending"}
                  onChange={(e) =>
                    update(family.id, { rsvp: e.target.value as RsvpStatus })
                  }
                  className="ed-input"
                >
                  {RSVP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span className="block text-xs text-ink-600 mb-1">
                도착 안내 (선택)
              </span>
              <input
                value={family.arrivalNote ?? ""}
                onChange={(e) =>
                  update(family.id, { arrivalNote: e.target.value })
                }
                className="ed-input"
                placeholder="예: 일요일 오후 4시쯤 도착할 예정이에요"
              />
            </label>
            <div className="pl-3 border-l-2 border-ink-900/15 space-y-2">
              <p className="text-xs text-ink-500">
                가족 멤버 이름 (안 적어도 됩니다. 적으면 카드에 표시돼요.)
              </p>
              {family.members.map((m) => (
                <div key={m.id} className="ed-row">
                  <input
                    value={m.name}
                    onChange={(e) =>
                      updateMember(family.id, m.id, { name: e.target.value })
                    }
                    className="ed-input flex-1"
                    placeholder="이름 (예: 정하)"
                  />
                  <input
                    value={m.note ?? ""}
                    onChange={(e) =>
                      updateMember(family.id, m.id, { note: e.target.value })
                    }
                    className="ed-input w-36"
                    placeholder="짧은 메모 (선택)"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(family.id, m.id)}
                    className="ed-btn ed-btn-danger"
                    aria-label="이 사람 지우기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addMember(family.id)}
                className="ed-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                사람 더 넣기
              </button>
            </div>
          </div>
        ))}
        {families.length === 0 && (
          <p className="text-sm italic text-ink-500">아직 등록된 가족이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────── Grocery */

function GroceryEditor({
  items,
  families,
  onChange,
}: {
  items: GroceryItem[];
  families: Family[];
  onChange: (items: GroceryItem[]) => void;
}) {
  function add() {
    onChange([
      ...items,
      { id: uid(), text: "", purchased: false },
    ]);
  }
  function update(id: string, patch: Partial<GroceryItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  return (
    <section id="sec-grocery" className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-ink-900/10">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
            함께 사올 것
          </h2>
          <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
            품목 이름만 적어도 됩니다. 담당 가족·예상 비용은 채워두면 페이지에서 한눈에 보여요.
          </p>
        </div>
        <button type="button" onClick={add} className="ed-btn shrink-0">
          <Plus className="w-3.5 h-3.5" />
          살 것 더 넣기
        </button>
      </header>
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="p-4 border border-ink-900/12 rounded-sm bg-hanji-100/40 space-y-3"
          >
            <div className="grid grid-cols-12 gap-2 items-end">
              <label className="col-span-12 sm:col-span-7">
                <span className="block text-xs text-ink-600 mb-1">살 것</span>
                <input
                  value={it.text}
                  onChange={(e) => update(it.id, { text: e.target.value })}
                  className="ed-input"
                  placeholder="예: 바베큐 고기"
                />
              </label>
              <label className="col-span-9 sm:col-span-4">
                <span className="block text-xs text-ink-600 mb-1">담당 가족</span>
                <select
                  value={it.assignedFamilyId ?? ""}
                  onChange={(e) =>
                    update(it.id, {
                      assignedFamilyId: e.target.value || undefined,
                    })
                  }
                  className="ed-input"
                >
                  <option value="">미정</option>
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="ed-btn ed-btn-danger w-full justify-center"
                  aria-label="이 항목 지우기"
                  title="이 항목 지우기"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label>
                <span className="block text-xs text-ink-600 mb-1">예상 가격</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={it.estimatedCost ?? ""}
                  onChange={(e) =>
                    update(it.id, {
                      estimatedCost: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="ed-input num text-sm"
                  placeholder="원"
                />
              </label>
              <label>
                <span className="block text-xs text-ink-600 mb-1">실제 가격</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={it.actualCost ?? ""}
                  onChange={(e) =>
                    update(it.id, {
                      actualCost: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="ed-input num text-sm"
                  placeholder="원"
                />
              </label>
              <label className="col-span-2 sm:col-span-2">
                <span className="block text-xs text-ink-600 mb-1">메모</span>
                <input
                  value={it.note ?? ""}
                  onChange={(e) => update(it.id, { note: e.target.value })}
                  className="ed-input text-sm"
                  placeholder="수량·브랜드 등 (선택)"
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-ink-700 select-none">
              <input
                type="checkbox"
                checked={it.purchased}
                onChange={(e) =>
                  update(it.id, { purchased: e.target.checked })
                }
                className="accent-ink-900 w-4 h-4"
              />
              <span>샀어요</span>
            </label>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm italic text-ink-500">아직 적어둔 게 없어요</li>
        )}
      </ul>
    </section>
  );
}

/* ─────────────────────────────────── Budget */

function BudgetEditor({
  budget,
  families,
  onChange,
}: {
  budget: Trip["budget"];
  families: Family[];
  onChange: (b: Trip["budget"]) => void;
}) {
  function patch(p: Partial<Trip["budget"]>) {
    onChange({ ...budget, ...p });
  }
  function addPayment() {
    onChange({
      ...budget,
      payments: [
        ...budget.payments,
        {
          id: uid(),
          familyId: families[0]?.id ?? "",
          amount: 0,
        },
      ],
    });
  }
  function updatePayment(id: string, p: Partial<DuePayment>) {
    onChange({
      ...budget,
      payments: budget.payments.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
  }
  function removePayment(id: string) {
    onChange({
      ...budget,
      payments: budget.payments.filter((x) => x.id !== id),
    });
  }
  function addExpense() {
    onChange({
      ...budget,
      expenses: [
        ...budget.expenses,
        { id: uid(), title: "", amount: 0, category: "식료품" },
      ],
    });
  }
  function updateExpense(id: string, p: Partial<Expense>) {
    onChange({
      ...budget,
      expenses: budget.expenses.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
  }
  function removeExpense(id: string) {
    onChange({
      ...budget,
      expenses: budget.expenses.filter((x) => x.id !== id),
    });
  }

  return (
    <section id="sec-budget" className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="mb-5 pb-4 border-b border-ink-900/10">
        <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
          모이고 쓰는 돈
        </h2>
        <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
          가족마다 낸 회비와 모임 중에 쓴 돈을 적어두면, 페이지에서 잔액이 자동으로 계산됩니다.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Field
          label="1인당 회비 (선택)"
          hint="가족별로 인원수 × 이 금액이 자동으로 예상 회비가 됩니다."
        >
          <input
            type="number"
            min={0}
            step={1000}
            value={budget.perPerson ?? ""}
            onChange={(e) =>
              patch({
                perPerson: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="ed-input num"
            placeholder="예: 30000"
          />
        </Field>
        <Field label="정산 안내 (선택)" hint="페이지 상단에 한 줄로 보입니다.">
          <input
            value={budget.note ?? ""}
            onChange={(e) => patch({ note: e.target.value })}
            className="ed-input"
            placeholder="예: 1인당 3만 원 · 잔액은 마지막 날 정산"
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-ink-900">가족별 회비 낸 기록</h3>
            <button type="button" onClick={addPayment} className="ed-btn">
              <Plus className="w-3.5 h-3.5" /> 기록 더 넣기
            </button>
          </header>
          <ul className="space-y-2">
            {budget.payments.map((p) => (
              <li
                key={p.id}
                className="p-3 border border-ink-900/12 rounded-sm bg-hanji-100/40 space-y-2"
              >
                <div className="ed-row">
                  <select
                    value={p.familyId}
                    onChange={(e) =>
                      updatePayment(p.id, { familyId: e.target.value })
                    }
                    className="ed-input flex-1"
                  >
                    {families.length === 0 && <option value="">가족 없음</option>}
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={p.amount}
                    onChange={(e) =>
                      updatePayment(p.id, { amount: Number(e.target.value) || 0 })
                    }
                    className="ed-input w-32 num"
                    placeholder="금액"
                  />
                  <button
                    type="button"
                    onClick={() => removePayment(p.id)}
                    className="ed-btn ed-btn-danger"
                    aria-label="이 회비 기록 지우기"
                    title="이 회비 기록 지우기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="ed-row">
                  <input
                    type="date"
                    value={p.paidAt ?? ""}
                    onChange={(e) =>
                      updatePayment(p.id, { paidAt: e.target.value || undefined })
                    }
                    className="ed-input w-44 text-sm"
                  />
                  <input
                    value={p.note ?? ""}
                    onChange={(e) =>
                      updatePayment(p.id, { note: e.target.value })
                    }
                    className="ed-input flex-1 text-sm"
                    placeholder="메모"
                  />
                </div>
              </li>
            ))}
            {budget.payments.length === 0 && (
              <li className="text-sm italic text-ink-500">아직 적힌 회비가 없어요</li>
            )}
          </ul>
        </div>

        <div>
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-ink-900">쓴 돈 내역</h3>
            <button type="button" onClick={addExpense} className="ed-btn">
              <Plus className="w-3.5 h-3.5" /> 쓴 돈 더 넣기
            </button>
          </header>
          <ul className="space-y-2">
            {budget.expenses.map((exp) => (
              <li
                key={exp.id}
                className="p-3 border border-ink-900/12 rounded-sm bg-hanji-100/40 space-y-2"
              >
                <div className="ed-row">
                  <input
                    value={exp.title}
                    onChange={(e) =>
                      updateExpense(exp.id, { title: e.target.value })
                    }
                    className="ed-input flex-1"
                    placeholder="지출 항목"
                  />
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={exp.amount}
                    onChange={(e) =>
                      updateExpense(exp.id, {
                        amount: Number(e.target.value) || 0,
                      })
                    }
                    className="ed-input w-32 num"
                    placeholder="금액"
                  />
                  <button
                    type="button"
                    onClick={() => removeExpense(exp.id)}
                    className="ed-btn ed-btn-danger"
                    aria-label="이 지출 지우기"
                    title="이 지출 지우기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="ed-row">
                  <select
                    value={exp.category ?? "기타"}
                    onChange={(e) =>
                      updateExpense(exp.id, {
                        category: e.target.value as Expense["category"],
                      })
                    }
                    className="ed-input w-28"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={exp.paidByFamilyId ?? ""}
                    onChange={(e) =>
                      updateExpense(exp.id, {
                        paidByFamilyId: e.target.value || undefined,
                      })
                    }
                    className="ed-input flex-1"
                  >
                    <option value="">결제 가족 (선택)</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={exp.occurredAt ?? ""}
                    onChange={(e) =>
                      updateExpense(exp.id, {
                        occurredAt: e.target.value || undefined,
                      })
                    }
                    className="ed-input w-40 text-sm"
                  />
                </div>
                <input
                  value={exp.note ?? ""}
                  onChange={(e) =>
                    updateExpense(exp.id, { note: e.target.value })
                  }
                  className="ed-input text-sm"
                  placeholder="메모"
                />
              </li>
            ))}
            {budget.expenses.length === 0 && (
              <li className="text-sm italic text-ink-500">아직 적힌 지출이 없어요</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────── Checklist */

function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  function add() {
    onChange([...items, { id: uid(), text: "", checked: false }]);
  }
  function update(id: string, patch: Partial<ChecklistItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  return (
    <section id="sec-checklist" className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-ink-900/10">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
            챙길 것
          </h2>
          <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
            모임 전에 같이 준비하면 좋은 일들이에요 (장보기 아닌 일들). 가족 누구나 페이지에서 직접 ✓ 표시할 수 있습니다.
          </p>
        </div>
        <button type="button" onClick={add} className="ed-btn shrink-0">
          <Plus className="w-3.5 h-3.5" />
          챙길 것 더 넣기
        </button>
      </header>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="ed-row">
            <input
              value={it.text}
              onChange={(e) => update(it.id, { text: e.target.value })}
              className="ed-input flex-1"
              placeholder="예: 보드게임 · 카드 챙기기"
            />
            <label className="ed-btn cursor-pointer">
              <input
                type="checkbox"
                checked={it.checked}
                onChange={(e) => update(it.id, { checked: e.target.checked })}
                className="accent-ink-900"
              />
              완료
            </label>
            <button
              type="button"
              onClick={() => remove(it.id)}
              className="ed-btn ed-btn-danger"
              aria-label="이 항목 지우기"
              title="이 항목 지우기"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm italic text-ink-500">아직 적힌 게 없어요</li>
        )}
      </ul>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Check, AlertCircle, Eye } from "lucide-react";
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

const TOC_SECTIONS: { id: string; label: string }[] = [
  { id: "sec-copy", label: "제목 · 카피" },
  { id: "sec-date", label: "날짜" },
  { id: "sec-place", label: "장소 · 지도" },
  { id: "sec-schedule", label: "일정" },
  { id: "sec-families", label: "가족 · 도착 확인" },
  { id: "sec-grocery", label: "장보기" },
  // { id: "sec-budget", label: "회비 · 지출" }, // 회비 섹션 숨김 — 추후 다시 노출
  { id: "sec-checklist", label: "준비물" },
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

  return (
    <div className="space-y-8">
      <SaveBar status={status} errorMsg={errorMsg} onSave={save} />

      <TableOfContents />

      <Section
        id="sec-copy"
        title="첫 화면 글"
        hint="가족들이 가장 먼저 보는 부분이에요. 제목·부제·인사말을 마음대로 바꿔보세요."
      >
        <Field label="제목" hint="예: 우리 가족 1박 2일">
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            className="ed-input"
          />
        </Field>
        <Field label="부제" hint="장소나 모임 한 줄 설명 (예: 어반스트림에서)">
          <input
            value={draft.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className="ed-input"
          />
        </Field>
        <Field
          label="인사말"
          hint="페이지 중간에 손글씨로 크게 보이는 한 마디예요."
        >
          <input
            value={draft.hero.headline}
            onChange={(e) => set("hero", { ...draft.hero, headline: e.target.value })}
            className="ed-input"
            placeholder="예: 오랜만에, 한자리에."
          />
        </Field>
        <Field label="설명 한 줄" hint="인사말 밑에 작게 들어가는 안내문이에요.">
          <textarea
            value={draft.hero.sub ?? ""}
            onChange={(e) => set("hero", { ...draft.hero, sub: e.target.value })}
            className="ed-input"
            rows={2}
            placeholder="예: 다 같이 모여 밥 먹고, 게임 하고, 산책 한 번 합시다."
          />
        </Field>
      </Section>

      <Section
        id="sec-date"
        title="날짜와 시간"
        hint="언제 모이고 언제 끝나는지 선택해 주세요. 첫 화면의 카운트다운에 쓰입니다."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="시작" hint="모임이 시작되는 시각">
            <input
              type="datetime-local"
              value={isoToLocalInput(draft.startsAt)}
              onChange={(e) =>
                set("startsAt", localInputToIso(e.target.value) || draft.startsAt)
              }
              className="ed-input"
            />
            {draft.startsAt && (
              <p className="text-xs text-ink-500 mt-1.5">
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
              <p className="text-xs text-ink-500 mt-1.5">
                ▸ {isoToKoreanPreview(draft.endsAt)}
              </p>
            )}
          </Field>
        </div>
      </Section>

      <Section
        id="sec-place"
        title="모이는 곳"
        hint="장소 이름과 주소를 넣으면 페이지에서 지도와 길찾기 버튼이 자동으로 만들어져요."
      >
        <Field label="장소 이름" hint="예: 어반스트림">
          <input
            value={draft.place.name}
            onChange={(e) => set("place", { ...draft.place, name: e.target.value })}
            className="ed-input"
          />
        </Field>
        <Field label="주소" hint="도로명 주소 그대로 넣으시면 됩니다.">
          <input
            value={draft.place.address ?? ""}
            onChange={(e) => set("place", { ...draft.place, address: e.target.value })}
            className="ed-input"
          />
        </Field>
        <Field
          label="좌표 (선택)"
          hint="비워두면 주소로 자동 검색이 됩니다. 정확히 핀을 찍고 싶으면 카카오맵에서 어반스트림을 검색해 주소창의 숫자를 옮겨 적으세요."
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
          hint="카카오맵에서 장소 페이지 주소를 그대로 복사해 넣으면 '카카오맵' 버튼이 그쪽으로 이어집니다."
        >
          <input
            value={draft.place.mapUrl ?? ""}
            onChange={(e) => set("place", { ...draft.place, mapUrl: e.target.value })}
            className="ed-input"
            placeholder="https://map.kakao.com/..."
          />
        </Field>
        <Field
          label="지도 직접 보여주기 (선택)"
          hint="페이지 안에 카카오 지도를 그대로 띄우고 싶을 때 사용합니다."
        >
          <details className="text-xs text-ink-600 mb-2 bg-hanji-100/60 border border-ink-900/12 rounded-sm">
            <summary className="cursor-pointer px-3 py-2 hover:bg-hanji-100">
              어떻게 하나요? (눌러서 자세히 보기)
            </summary>
            <ol className="px-4 pb-3 pt-1 space-y-1 list-decimal list-inside leading-relaxed">
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
            <p className="text-xs text-dancheong-700 mt-1.5 truncate">
              ✓ 지도 코드가 적용되었어요
            </p>
          )}
        </Field>
      </Section>

      <ScheduleEditor
        items={draft.schedule}
        onChange={(items) => set("schedule", items)}
      />

      <FamiliesEditor
        families={draft.families}
        onChange={(families) => set("families", families)}
      />

      <GroceryEditor
        items={draft.groceries}
        families={draft.families}
        onChange={(items) => set("groceries", items)}
      />

      {/* 회비 편집은 추후 다시 노출 예정 — 데이터(draft.budget)는 그대로 보존 */}
      {/*
      <BudgetEditor
        budget={draft.budget}
        families={draft.families}
        onChange={(b) => set("budget", b)}
      />
      */}

      <ChecklistEditor
        items={draft.checklist}
        onChange={(items) => set("checklist", items)}
      />

      <SaveBar status={status} errorMsg={errorMsg} onSave={save} />

      <style>{`
        .ed-input {
          width: 100%;
          padding: 0.55rem 0.8rem;
          background: var(--hanji-50);
          border: 1px solid rgba(20, 17, 13, 0.18);
          border-radius: 4px;
          font-family: var(--font-serif);
          font-size: 0.95rem;
          color: var(--ink-900);
          transition: border-color 0.2s var(--ease-out-apple);
        }
        .ed-input:focus {
          outline: none;
          border-color: rgba(20, 17, 13, 0.5);
        }
        .ed-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.8rem; font-size: 0.85rem;
          background: var(--hanji-100); color: var(--ink-900);
          border: 1px solid rgba(20, 17, 13, 0.18);
          border-radius: 4px;
          transition: background 0.2s var(--ease-out-apple);
        }
        .ed-btn:hover { background: var(--hanji-200); }
        .ed-btn-danger { color: var(--maple-700); border-color: rgba(168, 58, 37, 0.3); }
        .ed-btn-danger:hover { background: rgba(168, 58, 37, 0.06); }
        .ed-row { display: flex; gap: 0.5rem; align-items: center; }
      `}</style>
    </div>
  );
}

function SaveBar({
  status,
  errorMsg,
  onSave,
}: {
  status: Status;
  errorMsg: string;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 sm:-mx-10 px-6 sm:px-10 py-4 bg-hanji-100/85 backdrop-blur-xl border-b border-ink-900/10 flex items-center justify-between gap-3">
      <p className="text-sm text-ink-700 min-w-0">
        {status === "saved" && (
          <span className="text-dancheong-700 inline-flex items-center gap-1.5 font-medium">
            <Check className="w-4 h-4" />
            저장되었습니다 — 공개 페이지에 곧 반영됩니다
          </span>
        )}
        {status === "error" && (
          <span className="text-maple-700 inline-flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4" />
            저장 실패 · {errorMsg}
          </span>
        )}
        {status === "idle" && (
          <span className="text-ink-600">
            바꾼 내용을 적용하려면 <strong className="text-ink-900">저장</strong>을 누르세요.
          </span>
        )}
        {status === "saving" && (
          <span className="text-ink-700">저장하는 중입니다…</span>
        )}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-ink-700 hover:text-ink-900 hover:bg-ink-900/5 rounded-sm transition-colors"
          title="공개 페이지에서 결과 미리보기"
        >
          <Eye className="w-4 h-4" />
          미리보기
        </a>
        <button
          type="button"
          onClick={onSave}
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-dancheong-700 text-hanji-50 hover:bg-dancheong-600 disabled:opacity-50 rounded-sm text-sm sm:text-base font-medium transition-colors shadow-[0_2px_0_rgba(20,17,13,0.1)]"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id?: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="hanji-card p-6 sm:p-8 scroll-mt-24">
      <header className="mb-5 pb-4 border-b border-ink-900/10">
        <h2 className="font-serif text-xl sm:text-2xl text-ink-900 tracking-tight">
          {title}
        </h2>
        {hint && (
          <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{hint}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TableOfContents() {
  return (
    <nav
      aria-label="섹션 목차"
      className="hanji-card p-4 sm:p-5"
    >
      <p className="text-sm text-ink-700 mb-2.5">
        ✎ 바꾸고 싶은 곳으로 바로 가세요
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TOC_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="px-3.5 py-2 text-sm text-ink-900 bg-hanji-100 hover:bg-ink-900 hover:text-hanji-50 border border-ink-900/15 rounded-full transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

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
      <span className="block text-sm text-ink-800 font-medium mb-1.5">
        {label}
      </span>
      {hint && (
        <span className="block text-xs text-ink-500 mb-2 leading-relaxed">
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

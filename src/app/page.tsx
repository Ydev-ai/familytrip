import { readTrip } from "@/lib/store";
import { NavHeader } from "@/components/nav-header";
import { AdminShortcut } from "@/components/admin-shortcut";
import { ConnectionBanner } from "@/components/connection-banner";
import { Countdown } from "@/components/countdown";
import { ScheduleTimeline } from "@/components/schedule-timeline";
import { PlaceCard } from "@/components/place-card";
import { FamilyCards } from "@/components/family-cards";
import { ChecklistBoard } from "@/components/checklist-board";
import { GroceryBoard } from "@/components/grocery-board";
import { BudgetBoard } from "@/components/budget-board";
import { InkMountain, ScrollHeaderArt } from "@/components/ink-art";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    }).format(d);
  return { start: fmt(start), end: fmt(end) };
}

export default async function Home() {
  const trip = await readTrip();
  const { start, end } = formatDateRange(trip.startsAt, trip.endsAt);

  return (
    <>
      <NavHeader title={trip.title} />
      <AdminShortcut />
      <ConnectionBanner initial={trip} />
      <main id="top" className="flex-1 w-full">
        {/* ── HERO ───────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 sm:pt-24">
          <div className="absolute inset-x-0 top-0 h-px bg-ink-900/15" aria-hidden />
          <div className="relative max-w-4xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24">
            <div className="flex items-center justify-between mb-12">
              <span className="brush text-2xl text-maple-700 -rotate-2 inline-block">
                가족 모임
              </span>
              <span className="ink-seal">招待</span>
            </div>

            <h1 className="text-display text-ink-900">{trip.title}</h1>
            {trip.subtitle && (
              <p className="mt-4 text-xl sm:text-2xl text-ink-600 tracking-tight">
                {trip.subtitle}
              </p>
            )}

            <div className="mt-12 flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-12">
              <div>
                <p className="text-eyebrow mb-3">날짜</p>
                <p className="font-serif text-lg sm:text-xl text-ink-900 leading-snug tracking-tight">
                  {start}
                  <br />
                  <span className="text-ink-500">—</span> {end}
                </p>
              </div>
              <div className="hidden sm:block w-px self-stretch bg-ink-900/15" aria-hidden />
              <div>
                <p className="text-eyebrow mb-3">출발까지</p>
                <Countdown startsAt={trip.startsAt} />
              </div>
            </div>

            <div className="mt-16 max-w-2xl">
              <p className="brush text-3xl sm:text-5xl text-ink-900 leading-snug">
                {trip.hero.headline}
              </p>
              {trip.hero.sub && (
                <p className="mt-4 text-ink-700 text-base sm:text-lg leading-relaxed">
                  {trip.hero.sub}
                </p>
              )}
            </div>

            <InkMountain className="text-ink-900 absolute -bottom-2 right-0 w-[60%] max-w-2xl opacity-70 pointer-events-none" />
          </div>
        </section>

        <SectionAnchor id="place" kanji="所" eyebrow="장소" title="모이는 곳">
          <PlaceCard place={trip.place} />
        </SectionAnchor>

        <SectionAnchor id="schedule" kanji="日" eyebrow="일정" title="1박 2일">
          <ScheduleTimeline items={trip.schedule} />
        </SectionAnchor>

        <SectionAnchor id="families" kanji="家" eyebrow="가족" title="함께 하는 사람들">
          <FamilyCards initial={trip} />
        </SectionAnchor>

        <SectionAnchor id="groceries" kanji="市" eyebrow="장보기" title="함께 사올 것">
          <GroceryBoard initial={trip} />
        </SectionAnchor>

        <SectionAnchor id="budget" kanji="金" eyebrow="회비" title="모이고 쓰는 돈">
          <BudgetBoard initial={trip} />
        </SectionAnchor>

        <SectionAnchor id="checklist" kanji="備" eyebrow="준비" title="함께 챙길 것">
          <ChecklistBoard initial={trip} />
        </SectionAnchor>

        <footer className="max-w-4xl mx-auto px-6 sm:px-10 py-16 border-t border-ink-900/10">
          <div className="text-center">
            <ScrollHeaderArt className="text-ink-900 w-full max-w-md mx-auto opacity-40 mb-8" />
            <p className="brush text-3xl text-ink-700">― 만나서 반갑습니다 ―</p>
            <p className="text-eyebrow mt-6 num">
              updated{" "}
              {new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "Asia/Seoul",
              }).format(new Date(trip.updatedAt))}
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function SectionAnchor({
  id,
  kanji,
  eyebrow,
  title,
  children,
}: {
  id: string;
  kanji: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="max-w-4xl mx-auto px-6 sm:px-10 py-12 sm:py-20 scroll-mt-20"
    >
      <header className="mb-10 flex items-end gap-5">
        <span
          className="font-serif text-6xl sm:text-7xl text-maple-700/85 leading-none select-none"
          aria-hidden
        >
          {kanji}
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow">{eyebrow}</p>
          <h2 className="text-headline mt-1 text-ink-900">{title}</h2>
        </div>
        <div className="flex-1 ml-2 h-px bg-ink-900/15" />
      </header>
      {children}
    </section>
  );
}

import { notFound } from "next/navigation";
import { readTrip } from "@/lib/store";
import { ADMIN_SECRET } from "@/lib/admin";
import { AdminEditor } from "./editor";
import { StoreSecret } from "./store-secret";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;
  if (secret !== ADMIN_SECRET) {
    notFound();
  }
  const trip = await readTrip();
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 py-10">
      <StoreSecret secret={secret} />
      <header className="mb-8 flex items-end justify-between flex-wrap gap-3 border-b border-ink-900/15 pb-5">
        <div>
          <p className="brush text-2xl text-maple-700 -rotate-1 inline-block mb-1">
            ✎ 수정하는 곳
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 tracking-tight">
            우리 여행, 마음대로 바꿔보세요
          </h1>
          <p className="text-sm sm:text-base text-ink-600 mt-2 leading-relaxed">
            아래에서 일정·가족·장보기·회비 등을 자유롭게 고치고{" "}
            <strong className="text-ink-900">저장</strong>을 한 번 눌러주세요.
            <br className="hidden sm:inline" />
            가족들이 보는 페이지에 곧바로 반영됩니다.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border border-ink-900/25 text-ink-900 hover:bg-ink-900/5 rounded-sm transition-colors"
        >
          공개 페이지 보러 가기 →
        </a>
      </header>
      <AdminEditor initial={trip} adminKey={secret} />
    </main>
  );
}

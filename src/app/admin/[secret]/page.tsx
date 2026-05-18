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
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-6 sm:py-8">
      <StoreSecret secret={secret} />
      <AdminEditor initial={trip} adminKey={secret} />
    </main>
  );
}

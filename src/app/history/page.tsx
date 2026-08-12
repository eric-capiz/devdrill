import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteProfileButton } from "@/components/DeleteProfileButton";
import { RecapList } from "@/components/RecapList";
import { getUserHistory } from "@/lib/bests";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Show recaps",
  description: "Your previous Dev Drill quiz results.",
  robots: { index: false, follow: false },
};

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const history = await getUserHistory(session.userId);


  const items = history.map((item) => ({
    id: item._id.toString(),
    track: item.track,
    subject: item.subject,
    level: item.level,
    mode: item.mode,
    when: item.gradedAt ? new Date(item.gradedAt).toLocaleString() : "",
    score:
      item.mode === "unlimited"
        ? `${item.points ?? 0} pts`
        : `${item.scorePercent ?? 0}%`,
  }));

  return (
    <main className="flex-1 py-10 sm:py-12">
      <div className="shell max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl tracking-wide sm:text-5xl">
              SHOW RECAPS
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
              Previous quizzes I&apos;ve taken
            </p>
          </div>
          <DeleteProfileButton />
        </div>

        {items.length === 0 ? (
          <p className="board-tile mt-8 p-5 text-[var(--muted)] sm:mt-10 sm:p-6">
            No episodes yet.{" "}
            <Link href="/quiz/setup" className="text-[var(--gold)] underline">
              Buzz in
            </Link>
          </p>
        ) : (
          <RecapList items={items} />
        )}
      </div>
    </main>
  );
}

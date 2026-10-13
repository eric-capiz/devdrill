import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuizSetupForm } from "@/components/QuizSetupForm";
import { LEVELS, TRACKS, type Track } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Pre show setup",
  description: "Choose your level, track, category, and round length.",
  robots: { index: false, follow: false },
};

export default async function QuizSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; level?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const initialTrack = (TRACKS as readonly string[]).includes(params.track ?? "")
    ? (params.track as Track)
    : undefined;
  const initialLevel = (LEVELS as readonly string[]).includes(params.level ?? "")
    ? (params.level as (typeof LEVELS)[number])
    : undefined;
  return (
    <main className="flex-1 py-10 sm:py-12">
      <div className="shell max-w-xl">
        <h1 className="font-display text-3xl tracking-wide sm:text-5xl">
          PRE SHOW SETUP
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
          Level, track, category, round length.
        </p>
        <div className="mt-8 sm:mt-10">
          <QuizSetupForm
            initialTrack={initialTrack}
            initialLevel={initialLevel}
          />
        </div>
      </div>
    </main>
  );
}

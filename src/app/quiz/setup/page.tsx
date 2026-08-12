import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuizSetupForm } from "@/components/QuizSetupForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pre show setup",
  description: "Choose your level, track, category, and round length.",
  robots: { index: false, follow: false },
};

export default async function QuizSetupPage() {
  const session = await getSession();
  if (!session) redirect("/login");
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
          <QuizSetupForm />
        </div>
      </div>
    </main>
  );
}

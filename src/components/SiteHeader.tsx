"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { Buzzer } from "@/components/bits/Buzzer";
import { rankFor } from "@/lib/ranks";

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M12 2C9.5 7 5.5 9.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 9.5 14.5 7 12 2z" />
      <path
        d="M12 9c-1.4 2.4-3.2 3.4-3.2 6a3.2 3.2 0 0 0 6.4 0c0-2.6-1.8-3.6-3.2-6z"
        fill="var(--stage)"
        opacity="0.85"
      />
    </svg>
  );
}

function navClass(active: boolean) {
  return [
    "nav-link relative px-2.5 py-2 sm:px-3",
    active
      ? "text-[var(--spot)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--live)] after:shadow-[0_0_10px_rgba(126,182,255,0.55)] sm:after:inset-x-3"
      : "text-[var(--muted)]",
  ].join(" ");
}

function DailyQuestionCounter({
  bankMode,
  estimatedQuestionsLeft,
}: {
  bankMode: boolean;
  estimatedQuestionsLeft: number;
}) {
  const title = bankMode
    ? "New questions are paused for today. Rounds use stored questions until reset."
    : `About ${estimatedQuestionsLeft} new questions can still be written today. After that, rounds use stored questions until reset.`;

  return (
    <p
      title={title}
      className="flex min-w-0 items-baseline justify-center gap-1.5 font-extrabold uppercase tracking-[0.1em]"
    >
      {bankMode ? (
        <span className="truncate text-[0.7rem] text-[var(--buzzer)] sm:text-xs">
          Stored questions today
        </span>
      ) : (
        <>
          <span className="font-display text-lg tracking-wide text-[var(--gold)] sm:text-xl">
            {estimatedQuestionsLeft}
          </span>
          <span className="truncate text-[0.65rem] text-[var(--spot)] sm:text-xs">
            new questions left today
          </span>
        </>
      )}
    </p>
  );
}

export function SiteHeader({
  username,
  aiBudget,
  player,
}: {
  username: string | null;
  aiBudget: { bankMode: boolean; estimatedQuestionsLeft: number };
  player: { xp: number; streakCount: number } | null;
}) {
  const pathname = usePathname();
  const onPlay = pathname.startsWith("/quiz");
  const onRecaps = pathname.startsWith("/history");
  const onLogin = pathname.startsWith("/login");
  const onHome = pathname === "/";

  return (
    <header className="broadcast-bar sticky top-0 z-40">
      <div className="shell grid w-full grid-cols-1 gap-2 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="on-air hidden sm:inline-flex">On air</span>
          <Link
            href="/"
            aria-label="Dev Drill home"
            className={`brand-link flex min-w-0 items-center gap-2 sm:gap-2.5 ${
              onHome
                ? "text-[var(--spot)]"
                : "text-[var(--spot)]/80"
            }`}
          >
            <BrandMark
              size={34}
              priority
              className="h-7 w-7 sm:h-[34px] sm:w-[34px]"
            />
            <span
              className={`font-display shrink-0 text-lg tracking-wide sm:text-2xl ${
                onHome
                  ? "underline decoration-[var(--live)] decoration-2 underline-offset-4 sm:underline-offset-8"
                  : ""
              }`}
            >
              DEV DRILL
            </span>
          </Link>
        </div>

        <DailyQuestionCounter
          bankMode={aiBudget.bankMode}
          estimatedQuestionsLeft={aiBudget.estimatedQuestionsLeft}
        />

        <nav className="flex w-full items-center justify-between text-[0.7rem] font-extrabold uppercase tracking-wide max-sm:border-t max-sm:border-[var(--line)] max-sm:pt-2 sm:w-auto sm:justify-end sm:gap-2 sm:text-sm">
          {username ? (
            <>
              <Link
                href="/quiz/setup"
                className={navClass(onPlay)}
                aria-current={onPlay ? "page" : undefined}
              >
                Play
              </Link>
              <Link
                href="/history"
                className={navClass(onRecaps)}
                aria-current={onRecaps ? "page" : undefined}
              >
                Recaps
              </Link>
              <span className="hidden max-w-[9rem] truncate text-[var(--gold)] md:inline">
                @{username}
              </span>
              {player ? (
                <span
                  className="rank-chip hidden lg:inline-flex"
                  title={`${player.xp} XP total`}
                >
                  {rankFor(player.xp).title}
                </span>
              ) : null}
              {player && player.streakCount > 0 ? (
                <span
                  className="streak-pill"
                  title={`${player.streakCount}-day streak. Play every day to keep it burning.`}
                >
                  <FlameIcon />
                  {player.streakCount}
                </span>
              ) : null}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="nav-link px-2.5 py-2 text-[var(--muted)] sm:px-3"
                >
                  Exit
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={navClass(onLogin)}
                aria-current={onLogin ? "page" : undefined}
              >
                Log in
              </Link>
              <Buzzer>
                <Link
                  href="/signup"
                  className="btn btn-gold !min-h-0 !px-3 !py-2 text-[0.65rem] sm:!px-4 sm:text-xs"
                >
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Join the show</span>
                </Link>
              </Buzzer>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

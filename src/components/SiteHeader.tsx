"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { Buzzer } from "@/components/bits/Buzzer";

function navClass(active: boolean) {
  return [
    "relative px-2.5 py-2 sm:px-3 transition",
    active
      ? "text-[var(--spot)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--live)] after:shadow-[0_0_10px_rgba(126,182,255,0.55)] sm:after:inset-x-3"
      : "text-[var(--muted)] hover:text-[var(--spot)]",
  ].join(" ");
}

export function SiteHeader({ username }: { username: string | null }) {
  const pathname = usePathname();
  const onPlay = pathname.startsWith("/quiz");
  const onRecaps = pathname.startsWith("/history");
  const onLogin = pathname.startsWith("/login");
  const onHome = pathname === "/";

  return (
    <header className="broadcast-bar sticky top-0 z-40">
      <div className="shell flex w-full flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="on-air hidden sm:inline-flex">On air</span>
          <Link
            href="/"
            aria-label="Dev Drill home"
            className={`flex min-w-0 items-center gap-2 sm:gap-2.5 ${
              onHome
                ? "text-[var(--spot)]"
                : "text-[var(--spot)]/80 hover:text-[var(--spot)]"
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
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-2.5 py-2 text-[var(--muted)] transition hover:text-[var(--buzzer)] sm:px-3"
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

"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Buzzer } from "@/components/bits/Buzzer";
import { SlamText } from "@/components/bits/SlamText";

export function HomeHero({
  loggedIn,
  bankCount,
}: {
  loggedIn: boolean;
  bankCount: number;
}) {
  const bankLine = `${bankCount} questions in the bank`;

  return (
    <section className="relative overflow-hidden">
      <div className="spotlight" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 100%, transparent 20%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="shell relative flex min-h-[min(100svh,52rem)] flex-col items-center justify-center py-14 text-center sm:min-h-[calc(100svh-4.25rem)] sm:py-20">
        <motion.p
          className="eyebrow mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="neon-pink">●</span> Prime time · Live from the
          studio
        </motion.p>

        <motion.div
          className="marquee-sign w-full max-w-3xl"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div className="bulbs bulbs-top" aria-hidden />
          <h1 className="font-display text-[clamp(3rem,17vw,9rem)] leading-[0.9] tracking-wide">
            <span className="neon-gold">
              <SlamText text="DEV" />
            </span>{" "}
            <span className="neon-pink">
              <SlamText text="DRILL" />
            </span>
          </h1>
          <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.3em] text-[var(--muted)] sm:text-base">
            The championship quiz show for web developers
          </p>
          <div className="bulbs bulbs-pink bulbs-bottom" aria-hidden />
        </motion.div>

        <motion.p
          className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-[var(--muted)] sm:mt-8 sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Pick your lane, call your category, and buzz in. Fresh questions
          every night, a bank that never sleeps, and a hall of fame that
          never forgets.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {loggedIn ? (
            <Buzzer className="w-full sm:w-auto">
              <Link href="/quiz/setup" className="btn btn-buzzer w-full sm:w-auto">
                Take the stage
              </Link>
            </Buzzer>
          ) : (
            <>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/signup" className="btn btn-buzzer w-full sm:w-auto">
                  Claim your seat
                </Link>
              </Buzzer>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/login" className="btn btn-ghost w-full sm:w-auto">
                  Contestant login
                </Link>
              </Buzzer>
            </>
          )}
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span>
            <span className="neon-gold">{bankCount}</span> questions banked
          </span>
          <span>
            <span className="neon-pink">4</span> tracks
          </span>
          <span>
            <span className="neon-gold">3</span> leagues
          </span>
        </motion.div>
      </div>

      <div className="marquee">
        <div className="marquee-track text-[var(--spot)]">
          {Array.from({ length: 2 }).flatMap((_, copy) =>
            [
              bankLine,
              "Frontend",
              "Backend",
              "Fullstack",
              "DevOps",
              "Junior",
              "Mid",
              "Senior",
              bankLine,
              "Unlimited mode",
              "Buzz or pass",
            ].map((item, i) => (
              <span
                key={`${copy}-${item}-${i}`}
                className={item === bankLine ? "text-[var(--gold)]" : undefined}
              >
                {item} <span className="text-[var(--magenta)]">★</span>
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

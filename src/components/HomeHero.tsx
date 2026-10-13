"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Buzzer } from "@/components/bits/Buzzer";

export function HomeHero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="spotlight" aria-hidden />

      <div className="shell relative flex flex-col items-center py-16 text-center sm:py-24">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          The hot seat is open
        </motion.p>

        <motion.h1
          className="mt-5 font-display text-[clamp(3rem,13vw,7.5rem)] leading-[0.9] tracking-wide text-[var(--spot)]"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          TAKE THE
          <br />
          <span className="text-[var(--lime)]">HOT SEAT</span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-[var(--muted)] sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          30 seconds on the clock. Three lifelines. A ladder of prize
          rungs with safe havens. Answer fast, climb high, and know
          when to walk away.
        </motion.p>

        <motion.div
          className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loggedIn ? (
            <Buzzer className="w-full sm:w-auto">
              <a href="#categories" className="btn btn-buzzer w-full sm:w-auto">
                Take the hot seat
              </a>
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
                  Log in
                </Link>
              </Buzzer>
            </>
          )}
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <span>
            <span className="text-[var(--lime)]">30s</span> shot clock
          </span>
          <span>
            <span className="text-[var(--lime)]">3</span> lifelines
          </span>
          <span>
            <span className="text-[var(--lime)]">XP</span> every round
          </span>
        </motion.div>
      </div>

      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, copy) =>
            [
              "Beat the clock",
              "Use your lifeline",
              "Climb the ladder",
              "Daily streaks",
              "XP ranks",
              "Run it back",
            ].map((item, i) => (
              <span key={`${copy}-${i}`}>
                {item} <span className="text-[var(--lime)]">★</span>
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

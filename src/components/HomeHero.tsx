"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Buzzer } from "@/components/bits/Buzzer";
import { Mascot } from "@/components/Mascot";

export function HomeHero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="spotlight" aria-hidden />

      <div className="shell relative flex flex-col items-center py-12 text-center sm:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
        >
          <Mascot className="mascot-bounce h-28 w-28 sm:h-36 sm:w-36" />
        </motion.div>

        <motion.h1
          className="mt-6 font-display text-[clamp(3rem,15vw,7.5rem)] leading-[0.9] tracking-wide text-[var(--ink)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          DEV DRILL
        </motion.h1>

        <motion.p
          className="mt-3 font-display text-lg tracking-wide text-[var(--grape)] sm:text-2xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          The quiz arcade for web developers
        </motion.p>

        <motion.p
          className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-[var(--muted)] sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Play daily, keep your streak burning, and stack XP from{" "}
          <span className="font-extrabold text-[var(--ink)]">Hello World</span>{" "}
          all the way to{" "}
          <span className="font-extrabold text-[var(--ink)]">Stack Overlord</span>.
          Every round makes you sharper.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loggedIn ? (
            <Buzzer className="w-full sm:w-auto">
              <a href="#big-board" className="btn btn-buzzer w-full sm:w-auto">
                Play now
              </a>
            </Buzzer>
          ) : (
            <>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/signup" className="btn btn-buzzer w-full sm:w-auto">
                  Start playing free
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
      </div>

      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, copy) =>
            [
              "Daily streaks",
              "XP ranks",
              "Fresh questions",
              "Run it back",
              "No sign-up wall",
              "Buzz or pass",
            ].map((item, i) => (
              <span key={`${copy}-${i}`}>
                {item} <span>★</span>
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

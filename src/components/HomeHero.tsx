"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Buzzer } from "@/components/bits/Buzzer";

export function HomeHero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="spotlight" aria-hidden />

      <div className="shell relative flex flex-col items-center py-12 text-center sm:py-16">
        <motion.div
          className="starburst starburst-red mb-8"
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 8 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          Don&apos;t
          <br />
          get zapped!
        </motion.div>

        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ⚠ The extreme dev challenge ⚠
        </motion.p>

        <motion.h1
          className="comic-title mt-6 text-[clamp(3.5rem,17vw,9rem)] leading-[0.9]"
          initial={{ opacity: 0, y: 30, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
        >
          Dev
          <br />
          Drill!
        </motion.h1>

        <motion.p
          className="mt-8 max-w-2xl text-base font-bold leading-relaxed text-[var(--ink)] sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Twelve panels. Four tracks. Three leagues of pain. Pick your panel,
          answer fast, and dodge the zap — champions get drawn on the wall
          in <span className="bg-[var(--yellow)] px-1">permanent marker</span>.
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
                Enter the gauntlet
              </a>
            </Buzzer>
          ) : (
            <>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/signup" className="btn btn-buzzer w-full sm:w-auto">
                  Become a contestant
                </Link>
              </Buzzer>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/login" className="btn btn-ghost w-full sm:w-auto">
                  I&apos;m a contestant
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
              "Zap!",
              "Pow!",
              "Don't blink",
              "Know your closures",
              "Wham!",
              "No lifelines",
              "Bam!",
              "Trust your gut",
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

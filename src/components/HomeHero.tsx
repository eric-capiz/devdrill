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
          className="starburst mb-6"
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          Pick a
          <br />
          square!
        </motion.div>

        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          The daytime quiz show for web developers
        </motion.p>

        <motion.h1
          className="mt-4 font-display text-[clamp(3.25rem,16vw,8rem)] leading-[0.9] tracking-wide text-[var(--ink)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          DEV DRILL
        </motion.h1>

        <motion.p
          className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-[var(--muted)] sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Four tracks. Three leagues. One big board. Choose your square,
          answer fast, and take home the daily jackpot of pure glory.
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
                Come on down
              </a>
            </Buzzer>
          ) : (
            <>
              <Buzzer className="w-full sm:w-auto">
                <Link href="/signup" className="btn btn-buzzer w-full sm:w-auto">
                  Get in the audience
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
      </div>
    </section>
  );
}

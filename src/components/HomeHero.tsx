"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BrandMark } from "@/components/BrandMark";
import { Buzzer } from "@/components/bits/Buzzer";
import { SlamText } from "@/components/bits/SlamText";

export function HomeHero({ loggedIn }: { loggedIn: boolean }) {
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
        <motion.div
          className="mb-5 sm:mb-6"
          initial={{ opacity: 0, scale: 0.86, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <BrandMark
            size={96}
            priority
            className="h-16 w-16 sm:h-24 sm:w-24"
          />
        </motion.div>

        <h1 className="max-w-full font-display text-[clamp(2.75rem,15vw,8.5rem)] leading-[0.9] tracking-wide text-[var(--spot)]">
          <SlamText text="DEV DRILL" />
        </h1>

        <motion.p
          className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-[var(--muted)] sm:mt-6 sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          The enterprise quiz championship for web developers. Levels, tracks,
          subjects, buzzers, and a scoreboard that never forgets.
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
                Buzz in
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
      </div>

      <div className="marquee">
        <div className="marquee-track text-[var(--spot)]">
          {Array.from({ length: 2 }).flatMap((_, copy) =>
            [
              "Frontend",
              "Backend",
              "Fullstack",
              "DevOps",
              "Junior",
              "Mid",
              "Senior",
              "Unlimited mode",
              "Skip and rotate",
              "AI question bank",
            ].map((item, i) => (
              <span key={`${copy}-${item}-${i}`}>
                {item} <span className="text-[var(--gold)]">//</span>
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

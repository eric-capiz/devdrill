import Link from "next/link";
import { BigBoard } from "@/components/BigBoard";
import { HomeHero } from "@/components/HomeHero";
import { FlipScore } from "@/components/bits/FlipScore";
import { Reveal } from "@/components/bits/Reveal";
import { getBoardCounts, getGlobalBests } from "@/lib/bests";
import { getSession } from "@/lib/session";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const session = await getSession();
  const [{ topFixed, topUnlimited }, boardCounts] = await Promise.all([
    getGlobalBests(),
    getBoardCounts(),
  ]);
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Eric Capiz",
      url: "https://www.ericcapiz.com",
    },
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero loggedIn={!!session} />

      <section id="big-board" className="shell scroll-mt-24 py-12 sm:py-16">
        <Reveal>
          <div className="flex items-center justify-center gap-4">
            <span className="starburst starburst-blue hidden sm:inline-flex">
              12
              <br />
              panels!
            </span>
            <div className="text-center">
              <p className="eyebrow">Today&apos;s episode</p>
              <h2 className="comic-title mt-3 text-4xl sm:text-6xl">
                The Gauntlet
              </h2>
            </div>
            <span className="starburst hidden sm:inline-flex">
              $500
              <br />
              top prize!
            </span>
          </div>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm font-bold text-[var(--ink)] sm:text-base">
            Pick a panel, any panel. Higher rows hit harder. Losers get
            zapped — winners get wall space.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="mt-6 sm:mt-8">
          <BigBoard counts={boardCounts} />
        </Reveal>
        {!session ? (
          <p className="mt-4 text-center text-sm font-bold text-[var(--muted)]">
            <Link href="/signup" className="text-link">
              Become a contestant
            </Link>{" "}
            to play — it takes ten seconds.
          </p>
        ) : null}
      </section>

      <section className="halftone-band">
        <div className="shell py-12 sm:py-16">
          <Reveal>
            <p className="eyebrow text-center">Drawn in permanent marker</p>
            <h2 className="comic-title mt-3 text-center text-4xl sm:text-6xl">
              Champions&apos; Wall
            </h2>
          </Reveal>
          <div className="scoreboard mt-6 grid gap-0 overflow-hidden sm:mt-8 lg:grid-cols-2">
            <Reveal className="border-b-4 border-[var(--yellow)] p-5 sm:p-8 lg:border-b-0 lg:border-r-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--yellow)]">
                Daily jackpot
              </p>
              <h3 className="mt-2 font-display text-2xl tracking-wide text-white sm:text-3xl">
                TOP SCORE
              </h3>
              {topFixed ? (
                <>
                  <div className="champ-plate">
                    <span className="champ-name">@{topFixed.username ?? "unknown"}</span>
                  </div>
                  <p className="mt-4 font-display text-3xl tracking-wide text-white sm:mt-5 sm:text-5xl">
                    <FlipScore value={`${topFixed.scorePercent}%`} />
                  </p>
                  <p className="mt-2 text-sm font-bold leading-snug text-white/70">
                    {topFixed.track} · {topFixed.subject} · {topFixed.level}
                  </p>
                </>
              ) : (
                <p className="mt-6 text-white/70">
                  Wall&apos;s empty.{" "}
                  <Link href="#big-board" className="text-link">
                    Grab the marker
                  </Link>
                </p>
              )}
            </Reveal>

            <Reveal delay={0.1} className="p-5 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--red)]">
                Marathon board
              </p>
              <h3 className="mt-2 font-display text-2xl tracking-wide text-white sm:text-3xl">
                POINT STREAK
              </h3>
              {topUnlimited ? (
                <>
                  <div className="champ-plate">
                    <span className="champ-name">@{topUnlimited.username ?? "unknown"}</span>
                  </div>
                  <p className="mt-4 font-display text-3xl tracking-wide text-white sm:mt-5 sm:text-5xl">
                    <FlipScore value={`${topUnlimited.points}`} />
                    <span className="ml-2 text-xl text-white/70 sm:text-2xl">PTS</span>
                  </p>
                  <p className="mt-2 text-sm font-bold leading-snug text-white/70">
                    {topUnlimited.track} · {topUnlimited.subject} · {topUnlimited.level}
                  </p>
                </>
              ) : (
                <p className="mt-6 text-white/70">
                  No streaks yet.{" "}
                  <Link href="#big-board" className="text-link">
                    Start the run
                  </Link>
                </p>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="shell py-12 sm:py-16">
        <Reveal>
          <p className="eyebrow">Read this or get zapped</p>
          <h2 className="comic-title mt-3 text-4xl sm:text-6xl">
            Survival Guide
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3">
          {[
            [
              "PICK YOUR PANEL",
              "Twelve panels, four tracks, three leagues of pain. The dollar value tells you how hard it hits. Every panel is a fresh round.",
              "",
            ],
            [
              "BUZZ OR PASS",
              "Answer straight away or pass it — passed questions circle back for a second shot. Cowards pass. Smart cowards win.",
              "board-tile-accent-pink",
            ],
            [
              "DODGE THE ZAP",
              "Grading is instant and merciless, recaps save automatically, and legends get drawn on the wall. Come back tomorrow.",
              "board-tile-accent-cyan",
            ],
          ].map(([title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i} className="h-full">
              <div className={`board-tile ${accent} flex h-full flex-col p-5 sm:p-6`}>
                <p className="font-display text-xl tracking-wide text-[var(--red)] sm:text-2xl">
                  {title}
                </p>
                <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-[var(--ink)]">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

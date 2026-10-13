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
          <p className="eyebrow text-center">Pick your game</p>
          <h2 className="mt-3 text-center font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            THE BIG BOARD
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-[var(--muted)] sm:text-base">
            Four tracks, three leagues. Tap a square and you&apos;re in —
            bigger values, bigger bragging rights.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="mt-6 sm:mt-8">
          <BigBoard counts={boardCounts} />
        </Reveal>
        {!session ? (
          <p className="mt-4 text-center text-sm font-bold text-[var(--muted)]">
            <Link href="/signup" className="text-link">
              Create a free account
            </Link>{" "}
            to play — it takes ten seconds.
          </p>
        ) : null}
      </section>

      <section className="shell pb-12 sm:pb-16">
        <Reveal>
          <p className="eyebrow">Built for comebacks</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            WHY YOU&apos;LL BE BACK TOMORROW
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3">
          {[
            [
              "01",
              "DAILY STREAKS",
              "Play at least one round a day to keep your streak burning. Miss a day and it resets — the flame in the header keeps you honest.",
              "",
            ],
            [
              "02",
              "XP RANKS",
              "Every correct answer earns XP. Climb from Hello World to Script Kiddie, Merge Machine, 10x Engineer… all the way to Stack Overlord.",
              "board-tile-accent-pink",
            ],
            [
              "03",
              "RUN IT BACK",
              "Bombed a round? One tap replays the exact same setup. Grinding a weak subject is how ranks get earned.",
              "board-tile-accent-cyan",
            ],
          ].map(([num, title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i} className="h-full">
              <div className={`board-tile ${accent} flex h-full flex-col p-5 sm:p-6`}>
                <p className="font-display text-3xl tracking-wide text-[var(--grape)]" aria-hidden>
                  {num}
                </p>
                <p className="mt-3 font-display text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
                  {title}
                </p>
                <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-12 sm:pb-16">
        <Reveal>
          <p className="eyebrow">The legends</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            HALL OF FAME
          </h2>
        </Reveal>
        <div className="scoreboard mt-6 grid gap-0 overflow-hidden sm:mt-8 lg:grid-cols-2">
          <Reveal className="border-b-4 border-[var(--lemon)] p-5 sm:p-8 lg:border-b-0 lg:border-r-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--lemon)]">
              Top score
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-white sm:text-3xl">
              FIXED ROUNDS
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
                No legends yet.{" "}
                <Link href="#big-board" className="text-link">
                  Be the first
                </Link>
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1} className="p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--candy)]">
              Point streak
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-white sm:text-3xl">
              UNLIMITED RUNS
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
      </section>
    </main>
  );
}

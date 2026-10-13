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

      <section id="big-board" className="shell scroll-mt-24 pb-4 pt-2 sm:pb-6">
        <Reveal>
          <p className="eyebrow text-center">Today&apos;s show</p>
          <h2 className="mt-3 text-center font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            THE BIG BOARD
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-[var(--muted)] sm:text-base">
            Pick a square, any square. Higher rows mean harder questions and
            bigger bragging rights.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="mt-6 sm:mt-8">
          <BigBoard counts={boardCounts} />
        </Reveal>
        {!session ? (
          <p className="mt-4 text-center text-sm font-bold text-[var(--muted)]">
            <Link href="/signup" className="text-link">
              Join the show
            </Link>{" "}
            to play — it takes ten seconds.
          </p>
        ) : null}
      </section>

      <section className="shell py-12 sm:py-16">
        <Reveal>
          <p className="eyebrow">The winners&apos; circle</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            HALL OF FAME
          </h2>
        </Reveal>
        <div className="scoreboard mt-6 grid gap-0 overflow-hidden sm:mt-8 lg:grid-cols-2">
          <Reveal className="border-b-4 border-[var(--gold)] p-5 sm:p-8 lg:border-b-0 lg:border-r-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--gold)]">
              Daily jackpot
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-[#f6efe0] sm:text-3xl">
              TOP SCORE
            </h3>
            {topFixed ? (
              <>
                <div className="champ-plate">
                  <span className="champ-name">@{topFixed.username ?? "unknown"}</span>
                </div>
                <p className="mt-4 font-display text-3xl tracking-wide text-[#f6efe0] sm:mt-5 sm:text-5xl">
                  <FlipScore value={`${topFixed.scorePercent}%`} />
                </p>
                <p className="mt-2 text-sm font-bold leading-snug text-[#f6efe0]/70">
                  {topFixed.track} · {topFixed.subject} · {topFixed.level}
                </p>
              </>
            ) : (
              <p className="mt-6 text-[#f6efe0]/70">
                No winners yet.{" "}
                <Link href="#big-board" className="text-link">
                  Be the first
                </Link>
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1} className="p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--magenta)]">
              Marathon board
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-[#f6efe0] sm:text-3xl">
              POINT STREAK
            </h3>
            {topUnlimited ? (
              <>
                <div className="champ-plate">
                  <span className="champ-name">@{topUnlimited.username ?? "unknown"}</span>
                </div>
                <p className="mt-4 font-display text-3xl tracking-wide text-[#f6efe0] sm:mt-5 sm:text-5xl">
                  <FlipScore value={`${topUnlimited.points}`} />
                  <span className="ml-2 text-xl text-[#f6efe0]/70 sm:text-2xl">PTS</span>
                </p>
                <p className="mt-2 text-sm font-bold leading-snug text-[#f6efe0]/70">
                  {topUnlimited.track} · {topUnlimited.subject} · {topUnlimited.level}
                </p>
              </>
            ) : (
              <p className="mt-6 text-[#f6efe0]/70">
                No streaks yet.{" "}
                <Link href="#big-board" className="text-link">
                  Start the run
                </Link>
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="shell py-12 sm:py-16">
        <Reveal>
          <p className="eyebrow">Know before you go</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--ink)] sm:text-5xl">
            HOW THE SHOW WORKS
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3">
          {[
            [
              "PICK A SQUARE",
              "Twelve squares, four tracks, three leagues. The dollar value tells you how spicy it gets. Every square is a fresh round.",
              "",
            ],
            [
              "BUZZ OR PASS",
              "Answer straight away or pass — passed questions circle back for a second shot. Strategy beats speed.",
              "board-tile-accent-pink",
            ],
            [
              "TAKE THE JACKPOT",
              "Grading is instant and fair, recaps save automatically, and legends go up on the board. Come back tomorrow.",
              "board-tile-accent-cyan",
            ],
          ].map(([title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i} className="h-full">
              <div className={`board-tile ${accent} flex h-full flex-col p-5 sm:p-6`}>
                <p className="font-display text-xl tracking-wide text-[var(--magenta)] sm:text-2xl">
                  {title}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

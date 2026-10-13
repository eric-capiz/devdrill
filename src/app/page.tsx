import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { FlipScore } from "@/components/bits/FlipScore";
import { Reveal } from "@/components/bits/Reveal";
import { TRACKS } from "@/lib/catalog";
import { getBoardCounts, getGlobalBests } from "@/lib/bests";
import { getSession } from "@/lib/session";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

const TRACK_BLURBS: Record<string, string> = {
  Frontend: "Pixels, components, and the DOM under pressure.",
  Backend: "APIs, databases, and servers that never sleep.",
  Fullstack: "The whole stack. No place to hide.",
  DevOps: "Pipelines, containers, and 3 AM incidents.",
};

export default async function HomePage() {
  const session = await getSession();
  const [{ topFixed, topUnlimited }, boardCounts] = await Promise.all([
    getGlobalBests(),
    getBoardCounts(),
  ]);
  const siteUrl = getSiteUrl();

  const trackTotals = TRACKS.map((track) => ({
    track,
    total: Object.values(boardCounts[track] ?? {}).reduce((a, b) => a + b, 0),
  }));

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

      <section id="categories" className="shell scroll-mt-24 py-12 sm:py-16">
        <Reveal>
          <p className="eyebrow">Step one</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            CHOOSE YOUR CATEGORY
          </h2>
          <p className="mt-3 max-w-xl text-sm font-semibold text-[var(--muted)] sm:text-base">
            Four seats at the table. Pick the one where you&apos;re dangerous —
            or the one where you need the reps.
          </p>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
          {trackTotals.map(({ track, total }, i) => (
            <Reveal key={track} delay={0.08 * i} className="h-full">
              <Link
                href={`/quiz/setup?track=${encodeURIComponent(track)}`}
                className="board-tile flex h-full flex-col p-5 sm:p-6"
              >
                <p className="font-display text-2xl tracking-wide text-[var(--lime)] sm:text-3xl">
                  {track.toUpperCase()}
                </p>
                <p className="mt-2 flex-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                  {TRACK_BLURBS[track]}
                </p>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--gold)]">
                  {total > 0 ? `${total} questions banked` : "Fresh questions"} →
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-12 sm:pb-16">
        <Reveal>
          <p className="eyebrow">Step two</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            SURVIVE THE ROUND
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3">
          {[
            [
              "01",
              "BEAT THE CLOCK",
              "Every question gets 30 seconds. Hesitate too long and the round passes it for you. Fast fingers, faster brain.",
              "",
            ],
            [
              "02",
              "USE YOUR LIFELINE",
              "One 50:50 per round — it knocks out two wrong answers when you're stuck between choices. Spend it wisely.",
              "board-tile-accent-pink",
            ],
            [
              "03",
              "CLIMB THE LADDER",
              "Every question is a prize rung. Answer, lock in, and climb — the lights get brighter the higher you go.",
              "board-tile-accent-cyan",
            ],
          ].map(([num, title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i} className="h-full">
              <div className={`board-tile ${accent} flex h-full flex-col p-5 sm:p-6`}>
                <p className="font-display text-3xl tracking-wide text-[var(--lime)]" aria-hidden>
                  {num}
                </p>
                <p className="mt-3 font-display text-xl tracking-wide text-[var(--spot)] sm:text-2xl">
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
          <p className="eyebrow">Built for comebacks</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            WHY YOU&apos;LL BE BACK TOMORROW
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3">
          {[
            [
              "04",
              "DAILY STREAKS",
              "Play at least one round a day to keep your streak burning. Miss a day and it resets — the flame in the header keeps you honest.",
              "",
            ],
            [
              "05",
              "XP RANKS",
              "Every correct answer earns XP. Climb from Hello World to Script Kiddie, Merge Machine, 10x Engineer… all the way to Stack Overlord.",
              "board-tile-accent-pink",
            ],
            [
              "06",
              "RUN IT BACK",
              "Bombed a round? One tap replays the exact same setup. Grinding a weak subject is how ranks get earned.",
              "board-tile-accent-cyan",
            ],
          ].map(([num, title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i} className="h-full">
              <div className={`board-tile ${accent} flex h-full flex-col p-5 sm:p-6`}>
                <p className="font-display text-3xl tracking-wide text-[var(--gold)]" aria-hidden>
                  {num}
                </p>
                <p className="mt-3 font-display text-xl tracking-wide text-[var(--spot)] sm:text-2xl">
                  {title}
                </p>
                <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-14 sm:pb-20">
        <Reveal>
          <p className="eyebrow">The legends</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            HALL OF FAME
          </h2>
        </Reveal>
        <div className="scoreboard mt-6 grid gap-0 overflow-hidden sm:mt-8 lg:grid-cols-2">
          <Reveal className="border-b border-[var(--line)] p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--gold)]">
              Top score
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-[var(--spot)] sm:text-3xl">
              FIXED ROUNDS
            </h3>
            {topFixed ? (
              <>
                <div className="champ-plate">
                  <span className="champ-name">@{topFixed.username ?? "unknown"}</span>
                </div>
                <p className="mt-4 font-display text-3xl tracking-wide text-[var(--spot)] sm:mt-5 sm:text-5xl">
                  <FlipScore value={`${topFixed.scorePercent}%`} />
                </p>
                <p className="mt-2 text-sm font-bold leading-snug text-[var(--muted)]">
                  {topFixed.track} · {topFixed.subject} · {topFixed.level}
                </p>
              </>
            ) : (
              <p className="mt-6 text-[var(--muted)]">
                No legends yet.{" "}
                <Link href="#categories" className="text-link">
                  Be the first
                </Link>
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1} className="p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--lime)]">
              Point streak
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-[var(--spot)] sm:text-3xl">
              UNLIMITED RUNS
            </h3>
            {topUnlimited ? (
              <>
                <div className="champ-plate">
                  <span className="champ-name">@{topUnlimited.username ?? "unknown"}</span>
                </div>
                <p className="mt-4 font-display text-3xl tracking-wide text-[var(--spot)] sm:mt-5 sm:text-5xl">
                  <FlipScore value={`${topUnlimited.points}`} />
                  <span className="ml-2 text-xl text-[var(--muted)] sm:text-2xl">PTS</span>
                </p>
                <p className="mt-2 text-sm font-bold leading-snug text-[var(--muted)]">
                  {topUnlimited.track} · {topUnlimited.subject} · {topUnlimited.level}
                </p>
              </>
            ) : (
              <p className="mt-6 text-[var(--muted)]">
                No streaks yet.{" "}
                <Link href="#categories" className="text-link">
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

import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { FlipScore } from "@/components/bits/FlipScore";
import { Reveal } from "@/components/bits/Reveal";
import { getGlobalBests, getQuestionBankCount } from "@/lib/bests";
import { getSession } from "@/lib/session";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const session = await getSession();
  const [{ topFixed, topUnlimited }, bankCount] = await Promise.all([
    getGlobalBests(),
    getQuestionBankCount(),
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
      <HomeHero loggedIn={!!session} bankCount={bankCount} />

      <section className="shell py-12 sm:py-20">
        <Reveal>
          <p className="eyebrow">Tonight&apos;s format</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            FOUR ROUNDS. <span className="neon-pink">NO MERCY.</span>
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {[
            [
              "ROUND 1",
              "PICK YOUR LANE",
              "Junior, Mid, Senior, or the full gauntlet. Then lock your track: Frontend, Backend, Fullstack, DevOps.",
              "",
            ],
            [
              "ROUND 2",
              "CALL YOUR CATEGORY",
              "Subjects from HTML to Terraform. Fresh questions written nightly, banked forever.",
              "board-tile-accent-pink",
            ],
            [
              "ROUND 3",
              "BUZZ OR PASS",
              "Stuck? Pass it — the question circles back for a second shot. No shame, just strategy.",
              "board-tile-accent-cyan",
            ],
            [
              "FINAL ROUND",
              "THE RECAP",
              "Every answer graded against the key, with explanations under each question. Study the tape.",
              "",
            ],
          ].map(([value, title, copy, accent], i) => (
            <Reveal key={title} delay={0.08 * i}>
              <div className={`board-tile ${accent} p-5 sm:p-6`}>
                <p className="font-display text-2xl tracking-wide text-[var(--magenta)] sm:text-3xl">
                  {value}
                </p>
                <p className="mt-3 font-display text-xl tracking-wide text-[var(--spot)] sm:mt-4 sm:text-2xl">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-6 sm:pb-8">
        <Reveal>
          <p className="eyebrow">The legends board</p>
          <h2 className="mb-8 mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:mb-10 sm:text-5xl">
            HALL OF <span className="neon-gold">FAME</span>
          </h2>
        </Reveal>
        <div className="scoreboard grid gap-0 overflow-hidden lg:grid-cols-2">
          <Reveal className="border-b-2 border-[var(--gold)] p-5 sm:p-8 lg:border-b-0 lg:border-r-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--gold)]">
              Fixed length board
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">
              TOP SCORE
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
                <Link href="/quiz/setup" className="text-link">
                  Be the first
                </Link>
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1} className="p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--magenta)]">
              Unlimited board
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">
              POINT STREAK
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
                <Link href="/quiz/setup" className="text-link">
                  Start the run
                </Link>
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="shell py-12 sm:py-20">
        <Reveal>
          <p className="eyebrow">Read before you buzz</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide sm:text-5xl">
            FINE <span className="neon-pink">PRINT</span>
          </h2>
        </Reveal>
        <div className="mt-6 grid items-stretch gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
          {[
            [
              "THE PRODUCER",
              "Questions are written on demand while tonight's AI budget has headroom — code snippets included where they earn it. Everything gets banked. When the budget runs dry, the show goes on with stored questions until reset.",
            ],
            [
              "FAIR JUDGING",
              "Multiple choice is graded against the stored answer key. No AI at score time, no funny business.",
            ],
            [
              "STUDY THE TAPE",
              "Every graded show is saved with your answers, the explanations, and the final score. Champions review film.",
            ],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={0.08 * i} className="h-full">
              <div className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--line)] bg-[var(--stage-2)]/80 p-5 sm:p-6">
                <p className="font-display text-xl tracking-wide text-[var(--gold)] sm:text-2xl">
                  {t}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

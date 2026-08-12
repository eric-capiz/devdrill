import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { FlipScore } from "@/components/bits/FlipScore";
import { Reveal } from "@/components/bits/Reveal";
import { getGlobalBests } from "@/lib/bests";
import { getSession } from "@/lib/session";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default async function HomePage() {
  const session = await getSession();
  const { topFixed, topUnlimited } = await getGlobalBests();
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

      <section className="shell py-12 sm:py-20">
        <Reveal>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[var(--gold)]">
            The board
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-[var(--spot)] sm:text-5xl">
            HOW THE BOARD WORKS
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {[
            ["01", "CHOOSE A LANE", "Junior, Mid, Senior, or All, then lock your track."],
            ["02", "PICK A CATEGORY", "Subjects from HTML to Terraform. Fresh when needed."],
            ["03", "BUZZ OR PASS", "Skip rotates back after the main pass. Grade when you finish."],
            ["04", "FINAL REVIEW", "Correct, incorrect, and explanations under every question."],
          ].map(([value, title, copy], i) => (
            <Reveal key={title} delay={0.08 * i}>
              <div className="board-tile p-5 sm:p-6">
                <p className="font-display text-2xl tracking-wide text-[var(--gold)] sm:text-3xl">
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
        <div className="scoreboard grid gap-0 overflow-hidden lg:grid-cols-2">
          <Reveal className="border-b-2 border-[var(--gold)] p-5 sm:p-8 lg:border-b-0 lg:border-r-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--gold)]">
              Fixed length board
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">
              HIGH SCORE
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
                No scores yet.{" "}
                <Link href="/quiz/setup" className="text-[var(--gold)] underline">
                  Play a round
                </Link>
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1} className="p-5 sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--buzzer)]">
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
                <Link href="/quiz/setup" className="text-[var(--gold)] underline">
                  Start unlimited
                </Link>
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="shell py-12 sm:py-20">
        <Reveal>
          <h2 className="font-display text-3xl tracking-wide sm:text-5xl">
            HOUSE RULES
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
          {[
            [
              "AI PRODUCER",
              "Questions are written on demand, including short code snippets where it fits. They are stored in the bank and mixed with fresh AI when tokens allow.",
            ],
            [
              "FAIR JUDGING",
              "Multiple choice is graded against the stored key. No AI at score time.",
            ],
            [
              "INSTANT RECAPS",
              "Every graded show is saved with answers, explanations, and your result.",
            ],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={0.08 * i}>
              <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--stage-2)]/80 p-5 sm:p-6">
                <p className="font-display text-xl tracking-wide text-[var(--gold)] sm:text-2xl">
                  {t}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

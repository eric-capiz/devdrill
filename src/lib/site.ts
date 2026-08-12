export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_NAME = "Dev Drill";

export const SITE_DESCRIPTION =
  "The championship web development quiz show. Pick a level, track, and subject. Play fixed length or unlimited rounds with AI backed questions, saved recaps, and a live scoreboard.";

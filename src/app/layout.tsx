import { Archivo_Black, Barlow } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { getAiBudget } from "@/models/TokenUsage";
import { User } from "@/models/User";
import "./globals.css";

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-barlow",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Dev Drill",
    "web development quiz",
    "frontend quiz",
    "backend quiz",
    "devops quiz",
    "javascript quiz",
    "react quiz",
    "coding quiz",
    "developer practice",
  ],
  authors: [{ name: "Eric Capiz" }],
  creator: "Eric Capiz",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0817",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, aiBudget] = await Promise.all([
    getSession(),
    getAiBudget().catch(() => ({
      bankMode: true,
      estimatedQuestionsLeft: 0,
    })),
  ]);

  let player: { xp: number; streakCount: number } | null = null;
  if (session) {
    try {
      await connectDB();
      const user = await User.findById(session.userId)
        .select("xp streakCount")
        .lean();
      if (user) {
        player = {
          xp: user.xp ?? 0,
          streakCount: user.streakCount ?? 0,
        };
      }
    } catch {
      player = null;
    }
  }

  return (
    <html lang="en" className={`${archivo.variable} ${barlow.variable} h-full`}>
      <body className="flex min-h-full flex-col font-body antialiased">
        <SiteHeader
          username={session?.username ?? null}
          aiBudget={aiBudget}
          player={player}
        />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

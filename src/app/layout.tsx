import { Archivo_Black, Barlow } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/session";
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

export const metadata: Metadata = {
  title: "Dev Drill",
  description:
    "The championship web dev quiz show. Levels, tracks, subjects, and AI backed questions.",
  applicationName: "Dev Drill",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071433",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="en" className={`${archivo.variable} ${barlow.variable} h-full`}>
      <body className="flex min-h-full flex-col font-body antialiased">
        <SiteHeader username={session?.username ?? null} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

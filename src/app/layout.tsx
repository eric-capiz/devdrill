import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Drill",
  description:
    "Web development quiz app — levels, tracks, subjects, and AI-backed questions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

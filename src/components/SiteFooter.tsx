import { BrandMark } from "@/components/BrandMark";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--stage-2)]/80">
      <div className="shell flex flex-col items-center justify-between gap-3 py-4 text-center text-xs text-[var(--muted)] sm:flex-row sm:py-5 sm:text-left sm:text-sm">
        <p className="flex items-center justify-center gap-2 sm:justify-start">
          <BrandMark size={22} className="h-5 w-5 opacity-90" />
          <span>© {year} Dev Drill. All rights reserved.</span>
        </p>
        <p>
          Built by{" "}
          <a
            href="https://www.ericcapiz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-[var(--gold)] underline-offset-2 hover:underline"
          >
            Eric Capiz
          </a>
        </p>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteRecapAction } from "@/app/actions/quiz";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type RecapItem = {
  id: string;
  track: string;
  subject: string;
  level: string;
  mode: string;
  when: string;
  score: string;
};

type PendingDelete = {
  id: string;
  label: string;
};

export function RecapList({ items }: { items: RecapItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<PendingDelete | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (!pending) setTarget(null);
  }, [pending]);

  function onConfirm() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteRecapAction(target.id);
      if (!res.ok) {
        setError(res.message ?? "Could not delete recap");
        setTarget(null);
        return;
      }
      setTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      {error ? (
        <p className="mt-6 rounded-lg border border-[var(--buzzer)]/40 bg-[var(--buzzer)]/10 px-4 py-3 text-sm text-[var(--buzzer)]">
          {error}
        </p>
      ) : null}

      <ul className="mt-8 space-y-3 sm:mt-10">
        {items.map((item) => (
          <li key={item.id} className="board-tile p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Link
                href={`/quiz/${item.id}/results`}
                className="min-w-0 flex-1 transition hover:opacity-90"
              >
                <p className="font-display text-xl tracking-wide sm:text-2xl">
                  <span className="break-words">
                    {item.track} · {item.subject}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-snug text-[var(--muted)]">
                  {item.level} · {item.mode} · {item.when}
                </p>
              </Link>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="font-display text-2xl tracking-wide text-[var(--gold)] sm:text-3xl">
                  {item.score}
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setTarget({
                      id: item.id,
                      label: `${item.track} · ${item.subject}`,
                    })
                  }
                  className="min-h-10 rounded-lg border border-[var(--buzzer)]/50 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[var(--buzzer)] transition hover:bg-[var(--buzzer)]/15 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!target}
        title="Cut this recap?"
        description={
          target
            ? `Remove “${target.label}” from your show history. If it held a high score, the champ board updates on the next load.`
            : ""
        }
        confirmLabel="Cut recap"
        cancelLabel="Keep recap"
        pending={pending}
        onConfirm={onConfirm}
        onCancel={close}
      />
    </>
  );
}

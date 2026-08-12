"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending, onCancel]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            disabled={pending}
            className="absolute inset-0 bg-[#040b1d]/80 backdrop-blur-sm"
            onClick={() => {
              if (!pending) onCancel();
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative max-h-[min(92dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-[1.25rem] border-[3px] border-[var(--gold)] bg-[#040b1d] shadow-[0_0_48px_rgba(240,196,63,0.2),0_25px_60px_rgba(0,0,0,0.55)] sm:rounded-[1.25rem]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-gradient-to-b from-[rgba(7,20,51,0.95)] to-[rgba(7,20,51,0.7)] px-4 py-3 sm:px-5">
              <span className="on-air text-[0.65rem]">Studio notice</span>
              <span className="font-display text-[0.65rem] tracking-[0.16em] text-[var(--buzzer)] sm:text-xs sm:tracking-[0.2em]">
                FINAL CALL
              </span>
            </div>

            <div className="relative px-5 py-6 sm:px-8 sm:py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(255,59,92,0.18),transparent_70%)]"
              />
              <h2
                id={titleId}
                className="relative font-display text-2xl tracking-wide text-[var(--spot)] sm:text-4xl"
              >
                {title}
              </h2>
              <p
                id={descId}
                className="relative mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base"
              >
                {description}
              </p>

              <div className="relative mt-7 flex flex-col-reverse gap-3 pb-[env(safe-area-inset-bottom)] sm:mt-8 sm:flex-row sm:justify-end">
                <button
                  ref={cancelRef}
                  type="button"
                  disabled={pending}
                  onClick={onCancel}
                  className="btn btn-ghost w-full disabled:opacity-50 sm:w-auto"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={onConfirm}
                  className="btn btn-buzzer w-full disabled:opacity-50 sm:w-auto"
                >
                  {pending ? "Deleting..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

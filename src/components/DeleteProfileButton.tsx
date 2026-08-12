"use client";

import { useCallback, useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/actions/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DeleteProfileButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);

  function onConfirm() {
    startTransition(async () => {
      await deleteAccountAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="btn btn-ghost w-full !border-[var(--buzzer)] !px-3 !py-2 !text-[var(--buzzer)] text-xs sm:w-auto disabled:opacity-60"
      >
        Delete profile
      </button>

      <ConfirmDialog
        open={open}
        title="Delete profile?"
        description="This permanently removes your account, every recap, and any champion spots you hold. The shared question bank stays. This cannot be undone."
        confirmLabel="Delete profile"
        cancelLabel="Stay signed in"
        pending={pending}
        onConfirm={onConfirm}
        onCancel={close}
      />
    </>
  );
}

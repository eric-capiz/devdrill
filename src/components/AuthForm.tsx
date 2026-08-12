"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  loginAction,
  registerAction,
  type AuthFormState,
} from "@/app/actions/auth";
import { Buzzer } from "@/components/bits/Buzzer";

const initial: AuthFormState = { ok: false };

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.5 10.6a2.5 2.5 0 003 3M9.9 5.1A10.5 10.5 0 0121 12c-.6 1.1-1.4 2.1-2.3 3M6.1 6.2A10.4 10.4 0 003 12c1.8 3.7 5.2 6 9 6 1.2 0 2.3-.2 3.4-.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <motion.form
      action={formAction}
      className="podium w-full space-y-3.5 px-4 py-5 sm:px-5 sm:py-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="field"
        />
        {state.fieldErrors?.username?.[0] ? (
          <p className="mt-1 text-sm text-[var(--bad)]">
            {state.fieldErrors.username[0]}
          </p>
        ) : null}
      </div>

      {mode === "signup" ? (
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
          />
          {state.fieldErrors?.email?.[0] ? (
            <p className="mt-1 text-sm text-[var(--bad)]">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            className="field pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--ink)]/60 transition hover:text-[var(--ink)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {state.fieldErrors?.password?.[0] ? (
          <p className="mt-1 text-sm text-[var(--bad)]">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message && !state.ok ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[var(--bad)]">
          {state.message}
        </p>
      ) : null}

      <Buzzer>
        <button
          type="submit"
          disabled={pending}
          className={`btn w-full disabled:opacity-60 ${mode === "login" ? "btn-gold" : "btn-buzzer"}`}
        >
          {pending
            ? "Checking..."
            : mode === "login"
              ? "Enter studio"
              : "Join the cast"}
        </button>
      </Buzzer>

      <p className="text-center text-sm font-semibold text-[var(--ink)]/70">
        {mode === "login" ? (
          <>
            New contestant?{" "}
            <Link
              href="/signup"
              className="font-extrabold text-[var(--curtain)] underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already booked?{" "}
            <Link
              href="/login"
              className="font-extrabold text-[var(--stage)] underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </motion.form>
  );
}

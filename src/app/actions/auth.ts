"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  clearSessionCookie,
  requireSession,
  setSessionCookie,
} from "@/lib/session";
import { QuizAttempt } from "@/models/QuizAttempt";
import { User, hashPassword, verifyPassword } from "@/models/User";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type AuthFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Fix the highlighted fields",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, email, password } = parsed.data;
  await connectDB();

  const existing = await User.findOne({
    $or: [
      { username: username.toLowerCase() },
      { email: email.toLowerCase() },
    ],
  }).lean();

  if (existing) {
    const usernameTaken = existing.username === username.toLowerCase();
    return {
      ok: false,
      message: usernameTaken
        ? "That username is already taken"
        : "That email is already registered",
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
  });

  await setSessionCookie({
    userId: user._id.toString(),
    username: user.username,
  });

  return { ok: true };
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter your username and password",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await connectDB();
  const user = await User.findOne({
    username: parsed.data.username.toLowerCase(),
  });

  if (!user) {
    return { ok: false, message: "Invalid username or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Invalid username or password" };
  }

  await setSessionCookie({
    userId: user._id.toString(),
    username: user.username,
  });

  return { ok: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function deleteAccountAction() {
  const session = await requireSession().catch(() => null);
  if (!session) {
    redirect("/login");
  }

  await connectDB();
  await QuizAttempt.deleteMany({ userId: session.userId });
  await User.findByIdAndDelete(session.userId);
  await clearSessionCookie();

  revalidatePath("/");
  revalidatePath("/history");
  redirect("/");
}


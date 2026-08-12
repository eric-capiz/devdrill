import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Dev Drill and enter the studio.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <div className="shell w-full max-w-sm">
        <h1 className="font-display text-2xl tracking-wide sm:text-3xl">
          LOG IN
        </h1>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}

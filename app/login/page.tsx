import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSession, homeForRole } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.profile?.role));

  const params = await searchParams;
  const rawNext = params.next;
  const next =
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : undefined;
  const linkFailed = params.error === "auth";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see today's menu, rate meals and send feedback."
      footer={
        <>
          New to Mess Mate?{" "}
          <Link
            href="/signup"
            className="font-bold text-brand-600 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {linkFailed ? (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-[#8f1f17]"
        >
          That confirmation link has expired. Log in, or sign up again.
        </p>
      ) : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}

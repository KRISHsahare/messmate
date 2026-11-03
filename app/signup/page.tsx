import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getSession, homeForRole } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.profile?.role));

  return (
    <AuthShell
      title="Join Mess Mate"
      subtitle="Create a student account for your hostel mess."
      footer={
        <>
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold text-brand-600 underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}

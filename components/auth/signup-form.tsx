"use client";

import { useActionState, useEffect } from "react";

import type { AuthState } from "@/app/login/actions";
import { signup } from "@/app/signup/actions";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) toast({ message: state.error, tone: "error" });
    if (state.success) toast({ message: state.success, tone: "success" });
  }, [state, toast]);

  if (state.success) {
    return (
      <div className="rounded-2xl bg-leaf-100 px-5 py-6 text-center">
        <p className="font-display text-lg font-extrabold text-leaf-700">
          Confirm your email
        </p>
        <p className="mt-2 text-sm font-semibold text-[#1f5a33]">
          {state.success}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        id="name"
        name="name"
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Aarav Sharma"
        required
      />
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@college.edu"
        required
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters."
        minLength={8}
        required
      />
      <Field
        id="confirm"
        name="confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        minLength={8}
        required
      />

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-[#8f1f17]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="pt-1">
        <SubmitButton pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </div>
    </form>
  );
}

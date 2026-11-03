"use client";

import { useActionState, useEffect } from "react";

import { login, type AuthState } from "@/app/login/actions";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const initialState: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(login, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({ message: state.error, tone: "error" });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        autoComplete="current-password"
        placeholder="Your password"
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
        <SubmitButton pendingLabel="Signing in…">Log in</SubmitButton>
      </div>
    </form>
  );
}

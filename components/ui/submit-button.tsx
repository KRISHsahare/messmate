"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
};

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      className={`w-full ${className}`.trim()}
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

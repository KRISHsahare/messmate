"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Logo } from "@/components/brand/logo";
import { Button, buttonStyles } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      message: "Something went wrong while loading this page.",
      tone: "error",
    });
  }, [error, toast]);

  return (
    <main className="bg-warm-wash grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[2rem] bg-white p-8 text-center shadow-[var(--shadow-warm)] ring-1 ring-cream-200">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-cocoa-900">
            Something burnt in the kitchen
          </h1>
          <p className="text-sm font-medium text-cocoa-500">
            We couldn&apos;t load this page. Try again, or head back to the menu.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/menu"
            className={buttonStyles({
              variant: "secondary",
              size: "lg",
              className: "w-full",
            })}
          >
            Go to menu
          </Link>
        </div>
      </div>
    </main>
  );
}

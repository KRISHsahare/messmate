import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="bg-warm-wash flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo size="md" />
          <p className="text-sm font-semibold text-cocoa-500">
            Ghar ka khana, ab bina complaint. 🍛
          </p>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-[var(--shadow-warm)] ring-1 ring-cream-200 sm:p-8">
          <h1 className="text-2xl font-extrabold text-cocoa-900 sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-cocoa-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>

        {footer ? (
          <div className="mt-5 text-center text-sm font-semibold text-cocoa-500">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}

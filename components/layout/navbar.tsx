"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { CloseIcon, LogoutIcon, MenuIcon } from "@/components/icons";
import { navItemsForRole } from "@/components/layout/nav-items";
import { buttonStyles } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/database.types";

type NavbarProps = {
  profile: Pick<Profile, "name" | "role">;
  homeHref: string;
};

export function Navbar({ profile, homeHref }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItemsForRole(profile.role);

  // Lock background scrolling while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href={homeHref} />

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={[
                  "rounded-full px-4 py-2.5 text-sm font-bold transition",
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-600"
                    : "text-cocoa-700 hover:bg-cream-200",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right leading-tight">
              <p className="max-w-40 truncate text-sm font-bold text-cocoa-900">
                {profile.name}
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-cocoa-400 uppercase">
                {profile.role}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="grid size-11 place-items-center rounded-full bg-white text-cocoa-700 ring-1 ring-cream-300 transition hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                aria-label="Log out"
                title="Log out"
              >
                <LogoutIcon className="size-5" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center rounded-full text-cocoa-900 transition hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 md:hidden"
          >
            <MenuIcon className="size-7" />
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-cream-50 md:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-cream-200 px-4">
            <Logo href={homeHref} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-full text-cocoa-900 transition hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
            >
              <CloseIcon className="size-6" />
            </button>
          </div>

          <nav
            aria-label="Mobile"
            className="flex-1 overflow-y-auto px-4 py-2"
          >
            <ul>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className="flex min-h-14 items-center gap-3 border-b border-cream-200 py-4 font-display text-xl font-bold text-cocoa-900"
                    >
                      <Icon className="size-5 text-brand-500" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="space-y-3 border-t border-cream-200 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <p className="text-center text-sm font-semibold text-cocoa-500">
              Signed in as {profile.name} · {profile.role}
            </p>
            <form action={logout}>
              <button
                type="submit"
                className={buttonStyles({
                  variant: "secondary",
                  size: "lg",
                  className: "w-full",
                })}
              >
                <LogoutIcon className="size-5" />
                Log out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

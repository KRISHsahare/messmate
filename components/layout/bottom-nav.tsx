"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItemsForRole } from "@/components/layout/nav-items";
import type { UserRole } from "@/lib/database.types";

/** Thumb-friendly primary navigation for phones. */
export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex w-full max-w-md">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition",
                  active ? "text-brand-600" : "text-cocoa-500",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-8 w-12 place-items-center rounded-full transition",
                    active ? "bg-brand-50" : "bg-transparent",
                  ].join(" ")}
                >
                  <Icon className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

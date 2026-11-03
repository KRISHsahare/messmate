"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/menu", label: "Menu manager" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminTabs() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Admin sections" className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={isActive(tab.href) ? "page" : undefined}
              className={[
                "inline-flex h-11 items-center rounded-full px-4 text-sm font-bold whitespace-nowrap transition",
                isActive(tab.href)
                  ? "bg-cocoa-900 text-cream-50"
                  : "bg-white text-cocoa-700 ring-1 ring-cream-300 hover:bg-cream-50",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

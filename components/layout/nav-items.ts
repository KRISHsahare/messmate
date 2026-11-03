import type { ReactElement } from "react";

import {
  BowlIcon,
  ChatIcon,
  CompassIcon,
  FlagIcon,
  ShieldIcon,
} from "@/components/icons";
import type { UserRole } from "@/lib/database.types";

export type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactElement;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/menu", label: "Menu", icon: BowlIcon },
  { href: "/messes", label: "Messes", icon: CompassIcon },
  { href: "/my-feedback", label: "Feedback", icon: ChatIcon },
  { href: "/report", label: "Report", icon: FlagIcon },
  { href: "/admin", label: "Admin", icon: ShieldIcon, adminOnly: true },
];

/** Admin-only destinations are filtered out for students. */
export function navItemsForRole(role: UserRole) {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_CONTACTS_PATH } from "@/schemas/admin-contact";
import { ADMIN_DASHBOARD_PATH } from "@/schemas/auth";

const adminNavItems = [
  {
    href: ADMIN_DASHBOARD_PATH,
    label: "Tổng quan",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === ADMIN_DASHBOARD_PATH,
  },
  {
    href: ADMIN_CONTACTS_PATH,
    label: "Yêu cầu tư vấn",
    icon: Inbox,
    match: (pathname: string) =>
      pathname === ADMIN_CONTACTS_PATH ||
      pathname.startsWith(`${ADMIN_CONTACTS_PATH}/`),
  },
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Điều hướng quản trị" className="w-full border-t border-border/70 py-2.5 lg:w-auto lg:border-t-0 lg:py-0">
      <ul className="flex flex-wrap items-center gap-2">
        {adminNavItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/85 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  isLight?: boolean;
}

export function Breadcrumb({ items, className, isLight = false }: BreadcrumbProps) {
  return (
    <nav aria-label="Đường dẫn trang" className={cn("flex items-center text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className={cn(
              "focus-ring inline-flex items-center gap-1 rounded-sm transition-colors",
              isLight
                ? "text-cream/80 hover:text-white"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Trang chủ</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.title} className="inline-flex items-center gap-1.5 sm:gap-2">
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5",
                  isLight ? "text-cream/50" : "text-muted-foreground/60"
                )}
                aria-hidden="true"
              />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring rounded-sm transition-colors",
                    isLight
                      ? "text-cream/80 hover:text-white"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.title}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("font-medium", isLight ? "text-white" : "text-foreground")}
                >
                  {item.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

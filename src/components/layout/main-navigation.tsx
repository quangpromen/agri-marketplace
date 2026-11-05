"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  className?: string;
  isLight?: boolean;
}

export function MainNavigation({ className, isLight = false }: MainNavigationProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (title: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(title);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn("hidden items-center gap-1 lg:flex xl:gap-2", className)}
    >
      {mainNavigation.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : item.href !== "#" && pathname.startsWith(item.href);
        const isChildActive =
          hasChildren &&
          item.children?.some((child) => child.href !== "#" && pathname.startsWith(child.href));

        if (hasChildren) {
          const isOpen = openDropdown === item.title;

          return (
            <div
              key={item.title}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.title)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(isOpen ? null : item.title)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={cn(
                  "focus-ring inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-all",
                  isLight
                    ? "text-white/90 hover:text-accent"
                    : "text-foreground/90 hover:text-accent",
                  (isActive || isChildActive) && "font-bold text-accent"
                )}
              >
                <span>{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border-t-4 border-accent bg-white p-2 text-dark shadow-2xl duration-200"
                  role="menu"
                >
                  {item.children?.map((child) => {
                    const isSubActive = child.href !== "#" && pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                          isSubActive
                            ? "bg-accent font-bold text-dark"
                            : "text-gray-800 hover:bg-accent hover:text-dark"
                        )}
                      >
                        <div className="font-semibold">{child.title}</div>
                        {child.description && (
                          <div className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 hover:text-gray-900">
                            {child.description}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring rounded-md px-3 py-2 text-sm font-semibold transition-all",
              isLight ? "text-white/90 hover:text-accent" : "text-foreground/90 hover:text-accent",
              isActive && "font-bold text-accent"
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

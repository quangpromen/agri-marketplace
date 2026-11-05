import React from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  isLight?: boolean;
}

export function Logo({ className, isLight = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring inline-flex items-center gap-2.5 rounded-lg font-heading text-2xl font-extrabold tracking-tight transition-transform hover:opacity-95 sm:text-3xl",
        isLight ? "text-white" : "text-primary",
        className
      )}
      aria-label="Mộc Farm - Về trang chủ"
    >
      <span className="flex items-center justify-center text-accent">
        <Sprout className="h-8 w-8 animate-pulse text-accent" aria-hidden="true" />
      </span>
      <span className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-2xl font-extrabold tracking-tight sm:text-3xl",
            isLight ? "text-white" : "text-foreground"
          )}
        >
          Mộc
        </span>
        <span className="text-2xl font-extrabold tracking-tight text-accent sm:text-3xl">Farm</span>
      </span>
    </Link>
  );
}

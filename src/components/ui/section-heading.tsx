import React from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  asH1?: boolean;
}

export function SectionHeading({
  badge,
  title,
  description,
  align = "center",
  className,
  asH1 = false,
}: SectionHeadingProps) {
  const HeadingTag = asH1 ? "h1" : "h2";

  return (
    <div
      className={cn(
        "mb-10 flex flex-col space-y-3 md:mb-14",
        align === "center"
          ? "section-title items-center text-center"
          : "max-w-2xl items-start text-left",
        className
      )}
    >
      {badge && (
        <h5 className="mb-1 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
          <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{badge}</span>
        </h5>
      )}

      <HeadingTag className="text-2xl font-extrabold leading-[1.25] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[2.65rem]">
        {title}
      </HeadingTag>

      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

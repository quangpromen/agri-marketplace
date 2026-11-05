import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  isLight?: boolean;
}

export function SocialLinks({ className, iconClassName, isLight = false }: SocialLinksProps) {
  const socials = [
    { name: "Facebook", href: siteConfig.links.facebook, label: "Theo dõi Mộc Farm trên Facebook" },
    { name: "Zalo", href: siteConfig.links.zalo, label: "Nhắn tin Zalo với Mộc Farm" },
    { name: "YouTube", href: siteConfig.links.youtube, label: "Xem video Mộc Farm trên YouTube" },
  ];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {socials.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={cn(
            "focus-ring flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors",
            isLight
              ? "bg-white/10 text-cream hover:bg-white/20 hover:text-white"
              : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary",
            iconClassName
          )}
        >
          {item.name.charAt(0)}
        </Link>
      ))}
    </div>
  );
}

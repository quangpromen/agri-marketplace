"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/shared/logo";
import { MainNavigation } from "@/components/layout/main-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SocialLinks } from "@/components/shared/social-links";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On homepage before scroll: transparent navbar over hero.
  // On inner pages OR when scrolled: solid dark (#181818) navbar.
  const isTransparent = isHome && !isScrolled;

  return (
    <header className="z-50 flex w-full flex-col">
      {/* 1. Top Utility Bar */}
      <div
        className={cn(
          "w-full border-b py-2.5 text-xs transition-colors duration-300",
          isTransparent
            ? "border-white/10 bg-[#181818]/60 text-white/90 backdrop-blur-sm"
            : "border-primary-light/20 bg-primary text-cream"
        )}
      >
        <Container className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href={`tel:${siteConfig.contact.hotline.replace(/\s+/g, "")}`}
              className="focus-ring inline-flex items-center gap-1.5 rounded transition-colors hover:text-accent"
            >
              <Phone className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="font-semibold">{siteConfig.contact.phoneDisplay}</span>
            </a>

            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="focus-ring hidden items-center gap-1.5 rounded transition-colors hover:text-accent sm:inline-flex"
            >
              <Mail className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{siteConfig.contact.email}</span>
            </a>

            <div className="hidden items-center gap-1.5 text-cream/80 md:inline-flex">
              <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{siteConfig.contact.workingHours}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-cream/70 sm:inline">
              Kết nối cùng Mộc Farm:
            </span>
            <SocialLinks isLight iconClassName="h-6 w-6 text-[10px]" />
          </div>
        </Container>
      </div>

      {/* 2. Main Navbar */}
      <div
        className={cn(
          "z-50 w-full transition-all duration-300",
          isTransparent
            ? "absolute left-0 right-0 top-[41px] border-b border-white/15 bg-transparent text-white"
            : "sticky top-0 border-b border-white/10 bg-[#181818]/95 text-white shadow-lg backdrop-blur-md"
        )}
      >
        <Container className="flex h-20 items-center justify-between">
          <Logo isLight />

          <MainNavigation isLight />

          <div className="flex items-center gap-4">
            <Link
              href="/lien-he"
              className="btn-custom btn-custom-gold hidden font-bold text-dark shadow-md lg:inline-flex"
            >
              Nhận tư vấn
            </Link>

            <MobileNavigation isLight />
          </div>
        </Container>
      </div>
    </header>
  );
}

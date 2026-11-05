"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { SocialLinks } from "@/components/shared/social-links";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  isLight?: boolean;
}

export function MobileNavigation({ isLight = false }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Trang: true,
  });
  const pathname = usePathname();

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
          isLight ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/60"
        )}
        aria-label={isOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col justify-between overflow-y-auto bg-white p-6 text-dark shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-sm",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng di động"
      >
        <div>
          <div className="flex items-center justify-between border-b border-border pb-6">
            <Logo />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-muted/60 hover:text-dark"
              aria-label="Đóng menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Links list */}
          <nav className="mt-6 flex flex-col space-y-1" aria-label="Menu liên kết di động">
            {mainNavigation.map((item) => {
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isExpanded = expandedItems[item.title];
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href !== "#" && pathname.startsWith(item.href);

              if (hasChildren) {
                return (
                  <div key={item.title} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.title)}
                      className="flex min-h-[46px] items-center justify-between rounded-lg px-3.5 text-base font-semibold text-gray-800 transition-colors hover:bg-cream hover:text-accent"
                      aria-expanded={isExpanded}
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-gray-500 transition-transform duration-200",
                          isExpanded && "rotate-180 text-accent"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {isExpanded && (
                      <div className="my-1 ml-4 space-y-1 border-l-2 border-accent/40 pl-3">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex min-h-[42px] items-center rounded-lg px-3 text-sm font-medium transition-colors",
                              pathname === child.href
                                ? "bg-accent/20 font-bold text-accent"
                                : "text-gray-700 hover:bg-cream/60 hover:text-accent"
                            )}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "focus-ring flex min-h-[46px] items-center rounded-lg px-3.5 text-base font-semibold transition-colors",
                    isActive
                      ? "bg-accent font-bold text-dark"
                      : "text-gray-800 hover:bg-cream hover:text-accent"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* CTA and Contact in Drawer */}
        <div className="mt-6 space-y-5 border-t border-border pt-6">
          <Link
            href="/lien-he"
            onClick={() => setIsOpen(false)}
            className="btn-custom btn-custom-gold w-full justify-center text-center font-bold"
          >
            Nhận tư vấn ngay
          </Link>

          <div className="space-y-2.5 text-xs text-gray-600">
            <a
              href={`tel:${siteConfig.contact.hotline.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Hotline: {siteConfig.contact.phoneDisplay}</span>
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>{siteConfig.contact.email}</span>
            </a>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="line-clamp-2">{siteConfig.contact.address}</span>
            </div>
          </div>

          <div className="pt-2">
            <SocialLinks iconClassName="h-8 w-8 text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

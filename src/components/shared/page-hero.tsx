import React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Breadcrumb, BreadcrumbItem } from "@/components/shared/breadcrumb";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  imageUrl?: string;
  className?: string;
}

export function PageHero({
  title,
  description,
  breadcrumbs,
  imageUrl = "/images/hero/hero-1.jpg",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative flex h-[360px] w-full items-center justify-center overflow-hidden border-b border-white/10 bg-[#181818] sm:h-[420px] lg:h-[480px]",
        className
      )}
      aria-label={title}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-brightness-95" aria-hidden="true" />
      </div>

      {/* Content */}
      <Container className="relative z-10 flex flex-col items-center pt-12 text-center sm:pt-16">
        <h1 className="mb-4 max-w-4xl text-3xl font-extrabold leading-[1.2] tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
          {title}
        </h1>

        <Breadcrumb items={breadcrumbs} isLight className="mb-2 text-white/90" />

        {description && (
          <p className="mt-3 max-w-2xl text-sm font-normal leading-relaxed text-white/80 sm:text-base md:text-lg">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}

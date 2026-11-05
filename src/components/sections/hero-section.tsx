"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: 1,
    image: "/images/hero/hero-1.jpg",
    alt: "Cánh đồng nông nghiệp hữu cơ Mộc Farm trong sương sớm",
    badge: "Chào mừng đến với Mộc Farm",
    title: "Gieo mầm hôm nay, vun bồi tương lai xanh",
    description:
      "Hệ sinh thái nông nghiệp sạch, canh tác hữu cơ bền vững và phụng sự nguồn dinh dưỡng lành cho mọi gia đình Việt.",
    ctaText: "Khám phá Mộc Farm",
    ctaHref: "/gioi-thieu",
  },
  {
    id: 2,
    image: "/images/hero/hero-2.jpg",
    alt: "Nông trại xanh tươi thu hoạch nông sản sạch",
    badge: "Nông nghiệp thuận tự nhiên",
    title: "Nông sản an lành từ những mùa vụ bền vững",
    description:
      "Khởi nguồn từ đất mẹ thuần khiết, 100% không hóa chất độc hại, bảo toàn trọn vẹn vị ngon ngọt nguyên bản.",
    ctaText: "Khám phá dịch vụ",
    ctaHref: "/dich-vu",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative h-[640px] w-full select-none overflow-hidden bg-[#181818] sm:h-[740px] lg:h-[860px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Khung trình diễn nổi bật Mộc Farm"
    >
      {/* Slides Container */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;

        return (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            )}
            aria-hidden={!isActive}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="scale-105 object-cover object-center transition-transform duration-[7000ms] ease-out motion-reduce:transform-none"
              />
              {/* Dark Overlay (24, 24, 24, .5) */}
              <div
                className="absolute inset-0 bg-black/55 backdrop-brightness-95"
                aria-hidden="true"
              />
            </div>

            {/* Slide Content */}
            <div className="relative z-20 flex h-full items-center justify-center px-6 pb-12 pt-20 text-center sm:px-12">
              <div className="animate-in fade-in slide-in-from-bottom-6 mx-auto max-w-4xl space-y-6 duration-700 sm:space-y-8">
                {/* Badge with Leaf Icon */}
                <h5 className="inline-flex items-center justify-center gap-2 text-base font-bold tracking-wide text-white/95 sm:text-lg">
                  <Leaf
                    className="h-5 w-5 shrink-0 animate-bounce text-accent"
                    aria-hidden="true"
                  />
                  <span>{slide.badge}</span>
                </h5>

                {/* Main Hero Display Heading */}
                <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-[4.5rem]">
                  {slide.title}
                </h1>

                {/* Description */}
                <p className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-white/85 sm:text-lg md:text-xl">
                  {slide.description}
                </p>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link
                    href={slide.ctaHref}
                    className="btn-custom btn-custom-gold inline-flex text-base font-bold text-dark shadow-2xl"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Chuyển đến slide trước"
        className="focus-ring absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-accent hover:text-dark sm:left-8 sm:h-14 sm:w-14"
      >
        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Chuyển đến slide kế tiếp"
        className="focus-ring absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-accent hover:text-dark sm:right-8 sm:h-14 sm:w-14"
      >
        <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Chuyển đến slide ${idx + 1}`}
            className={cn(
              "focus-ring h-3 rounded-full transition-all duration-300",
              idx === currentSlide ? "w-8 bg-accent" : "w-3 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </section>
  );
}

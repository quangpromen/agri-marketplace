"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { historyMilestones } from "@/data/stats";
import { cn } from "@/lib/utils";

export function HistorySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCount(1);
      } else if (width < 1024) {
        setVisibleCount(2);
      } else if (width < 1280) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const totalItems = historyMilestones.length;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  const prev = () => {
    setActiveIndex((current) => Math.max(0, current - 1));
  };

  const next = () => {
    setActiveIndex((current) => Math.min(maxIndex, current + 1));
  };

  return (
    <section
      className="overflow-hidden border-b border-border bg-white py-16 sm:py-20 lg:py-24"
      id="hanh-trinh"
    >
      {/* 1. Header & Panoramic Image with Gold Border  */}
      <div className="w-full border-b-4 border-accent pb-0">
        <div className="section-title mb-10 px-4 text-center">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Hành Trình Mộc Farm</span>
          </h5>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Chặng Đường Kiến Tạo Nông Nghiệp Xanh
          </h2>
        </div>

        {/* Panoramic Banner */}
        <div className="relative h-56 w-full overflow-hidden bg-muted sm:h-72 md:h-96 lg:h-[420px]">
          <Image
            src="/images/history/history-banner.jpg"
            alt="Toàn cảnh nông trại và đồi chè hữu cơ Mộc Farm"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 2. Horizontal Timeline Carousel */}
      <Container className="pb-6 pt-16">
        <div className="relative">
          {/* Timeline Viewport */}
          <div className="overflow-hidden" ref={containerRef}>
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${(activeIndex * 100) / visibleCount}%)`,
              }}
            >
              {historyMilestones.map((item, idx) => {
                const isItemActive = idx === activeIndex;
                const formattedNumber = (idx + 1).toString().padStart(2, "0");

                return (
                  <div
                    key={item.year}
                    className="flex-shrink-0 px-4"
                    style={{ width: `${100 / visibleCount}%` }}
                  >
                    <div
                      className={cn(
                        "history-item rounded-r-2xl bg-cream/30 pr-4 transition-all duration-300",
                        isItemActive && "active bg-cream/70 shadow-sm"
                      )}
                    >
                      {/* Top Date Badge */}
                      <div className="history-date shadow-sm">{item.year}</div>

                      {/* Content */}
                      <h3 className="mb-3 text-lg font-bold leading-snug text-foreground sm:text-xl">
                        {item.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {item.description}
                      </p>

                      {/* Bottom Circular Number */}
                      <div className="history-number shadow-sm">{formattedNumber}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="mt-12 flex items-center justify-between pt-4">
            {/* Year Dots */}
            <div className="flex items-center gap-2">
              {historyMilestones.map((milestone, idx) => (
                <button
                  key={milestone.year}
                  type="button"
                  onClick={() => setActiveIndex(Math.min(idx, maxIndex))}
                  className={cn(
                    "focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                    idx === activeIndex
                      ? "bg-accent text-dark shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {milestone.year}
                </button>
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={activeIndex === 0}
                aria-label="Xem cột mốc trước"
                className="focus-ring flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-dark shadow-sm transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={activeIndex >= maxIndex}
                aria-label="Xem cột mốc tiếp theo"
                className="focus-ring flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-dark shadow-sm transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

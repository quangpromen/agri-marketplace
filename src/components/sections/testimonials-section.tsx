"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Leaf, Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { testimonialsData } from "@/data/testimonials";

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsPerView(1);
      } else if (width < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const total = testimonialsData.length;
  const maxIndex = Math.max(0, total - itemsPerView);

  const prev = () => {
    setCurrentIndex((current) => Math.max(0, current - 1));
  };

  const next = () => {
    setCurrentIndex((current) => Math.min(maxIndex, current + 1));
  };

  return (
    <section
      className="overflow-hidden border-b border-border bg-white py-16 sm:py-20 lg:py-24"
      id="danh-gia"
    >
      <Container>
        {/* Section Heading */}
        <div className="section-title mb-12 text-center sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Đánh Giá Khách Hàng</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Khách Hàng Nói Gì Về Mộc Farm
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Sự hài lòng và sức khỏe của hàng nghìn gia đình, đầu bếp và đối tác là động lực để chúng
            tôi gìn giữ đất lành mỗi ngày.
          </p>
        </div>

        {/* Carousel Viewport  */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
              }}
            >
              {testimonialsData.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 px-3 sm:px-4"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-cream/50 p-6 text-center shadow-sm transition-colors hover:bg-cream/80 sm:p-8">
                    <div>
                      {/* Quote Icon  */}
                      <Quote className="mx-auto mb-4 h-10 w-10 text-accent/80" aria-hidden="true" />

                      {/* Customer Photo */}
                      <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-accent bg-muted shadow-md">
                        <Image
                          src={item.avatarUrl}
                          alt={item.author}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      {/* Star Rating */}
                      <div className="mb-4 flex items-center justify-center gap-1 text-accent">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-accent text-accent"
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      {/* Content */}
                      <p className="mb-6 text-sm italic leading-relaxed text-foreground/85 sm:text-base">
                        &ldquo;{item.content}&rdquo;
                      </p>
                    </div>

                    {/* Author & Role */}
                    <div className="border-t border-border/60 pt-4">
                      <h4 className="text-base font-bold text-foreground sm:text-lg">
                        {item.author}
                      </h4>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {item.role} • {item.organization}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Arrows */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Đánh giá trước"
              className="focus-ring flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-dark shadow-sm transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={currentIndex >= maxIndex}
              aria-label="Đánh giá tiếp theo"
              className="focus-ring flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-dark shadow-sm transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

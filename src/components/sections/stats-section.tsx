"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";

interface StatItem {
  id: string;
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  {
    id: "vung-trong",
    target: 195,
    suffix: "+",
    label: "Hecta Vùng Trồng",
    description: "Quy hoạch vùng trồng hữu cơ đạt chuẩn tại Lâm Đồng, Sơn La, Bến Tre và Cà Mau.",
  },
  {
    id: "nong-ho",
    target: 80,
    suffix: "+",
    label: "Nông Hộ Liên Kết",
    description: "Hợp tác xã và nông dân đồng hành phát triển nông nghiệp sinh thái tuần hoàn.",
  },
  {
    id: "khach-hang",
    target: 12000,
    suffix: "+",
    label: "Khách Hàng Tin Chọn",
    description: "Hộ gia đình, chuỗi nhà hàng cao cấp và cửa hàng thực phẩm sạch toàn quốc.",
  },
];

export function StatsSection() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCounts(stats.map((s) => s.target));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;

          const duration = 2000;
          const frameDuration = 1000 / 60;
          const totalFrames = Math.round(duration / frameDuration);
          let frame = 0;

          const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // ease-out-quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);

            setCounts(stats.map((s) => Math.round(s.target * easeProgress)));

            if (frame >= totalFrames) {
              clearInterval(timer);
              setCounts(stats.map((s) => s.target));
            }
          }, frameDuration);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const formatNumber = (num: number, target: number) => {
    if (target >= 1000) {
      return num.toLocaleString("vi-VN");
    }
    return num.toString();
  };

  return (
    <section ref={sectionRef} className="border-b border-border bg-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {stats.map((stat, idx) => (
            <div
              key={stat.id}
              className="relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl border border-border/80 bg-cream/70 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md sm:p-10"
            >
              {/* Background watermark illustration */}
              <div
                className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 opacity-25"
                aria-hidden="true"
              >
                <Image
                  src="/images/common/fact-pattern.svg"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>

              {/* Text Content */}
              <div className="relative z-10 space-y-2">
                <div className="font-heading text-4xl font-black tracking-tight text-accent sm:text-5xl lg:text-6xl">
                  <span>{formatNumber(counts[idx], stat.target)}</span>
                  <span>{stat.suffix}</span>
                </div>

                <h3 className="text-xl font-bold text-foreground sm:text-2xl">{stat.label}</h3>

                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

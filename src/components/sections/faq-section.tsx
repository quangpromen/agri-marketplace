"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Leaf, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { faqsData } from "@/data/faqs";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      className="border-b border-border bg-cream/40 py-16 sm:py-20 lg:py-24"
      id="cau-hoi-thuong-gap"
    >
      <Container>
        {/* Section Heading */}
        <div className="mb-12 text-left sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Hỏi & Đáp Nông Nghiệp</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Những Thắc Mắc Thường Gặp Về Mộc Farm
          </h2>
        </div>

        {/* 2 Columns  */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Text + Image (col-lg-6) */}
          <div className="space-y-6 lg:col-span-6">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Chúng tôi hiểu rằng khi lựa chọn thực phẩm cho gia đình hoặc tìm kiếm đối tác cung ứng
              nông sản, sự minh bạch và uy tín là yếu tố quan trọng nhất. Dưới đây là những giải đáp
              chi tiết về quy trình canh tác, tiêu chuẩn chất lượng và phương thức phân phối của Mộc
              Farm.
            </p>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <Image
                src="/images/faq/faq-farm.jpg"
                alt="Kỹ sư Mộc Farm kiểm tra chất lượng rau hữu cơ trên đồng ruộng"
                fill
                sizes="(max-width: 1024px) 100vw, 580px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Column: Accordion (col-lg-6) */}
          <div
            className="space-y-4 lg:col-span-6"
            role="region"
            aria-label="Danh sách câu hỏi thường gặp"
          >
            {faqsData.map((faq, index) => {
              const isOpen = openId === faq.id;
              const formattedNumber = `${index + 1}. `;

              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-header-${faq.id}`}
                    className="focus-ring flex w-full items-center justify-between gap-4 p-5 text-left text-base font-bold text-foreground transition-colors hover:text-accent sm:p-6 sm:text-lg"
                  >
                    <span>
                      <span className="text-accent">{formattedNumber}</span>
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cream transition-transform duration-300",
                        isOpen && "rotate-180 bg-accent text-dark"
                      )}
                    >
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-header-${faq.id}`}
                      className="animate-in fade-in border-t border-border/50 px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground duration-200 sm:px-6 sm:pb-6"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

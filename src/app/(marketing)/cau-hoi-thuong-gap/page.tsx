import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { Accordion } from "@/components/ui/accordion";
import { faqsData } from "@/data/faqs";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { getButtonClassName } from "@/components/ui/button";

export const metadata: Metadata = constructMetadata({
  title: "Câu Hỏi Thường Gặp & Giải Đáp Thắc Mắc",
  description:
    "Tổng hợp câu hỏi và câu trả lời về phương thức canh tác hữu cơ, chứng nhận, quy trình giao nhận nông sản tại Mộc Farm.",
});

export default function FaqPage() {
  const accordionItems = faqsData.map((faq) => ({
    id: faq.id,
    title: faq.question,
    content: faq.answer,
  }));

  return (
    <>
      <PageHero
        title="Câu Hỏi Thường Gặp"
        description="Giải đáp chi tiết mọi thắc mắc của bạn về tiêu chuẩn chất lượng và phương thức hoạt động của Mộc Farm."
        breadcrumbs={[{ title: "Hỏi đáp" }]}
      />

      <section className="bg-background py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            <Accordion items={accordionItems} defaultOpenId="faq-1" />

            {/* Khung hỗ trợ trực tiếp */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-foreground">
                Vẫn Còn Thắc Mắc Chưa Được Giải Đáp?
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                Đội ngũ chuyên viên tư vấn nông học của Mộc Farm luôn sẵn sàng lắng nghe và giải đáp
                mọi câu hỏi cụ thể từ bạn.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
                <a
                  href={`tel:${siteConfig.contact.hotline.replace(/\s+/g, "")}`}
                  className={getButtonClassName({
                    variant: "default",
                    className: "w-full gap-2 sm:w-auto",
                  })}
                >
                  <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  <span>Gọi hotline: {siteConfig.contact.phoneDisplay}</span>
                </a>

                <Link
                  href="/lien-he"
                  className={getButtonClassName({
                    variant: "outline",
                    className: "w-full gap-2 sm:w-auto",
                  })}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Gửi tin nhắn trực tiếp</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

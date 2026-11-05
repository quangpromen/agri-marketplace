import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck, Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { pricingPlans } from "@/data/stats";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Bảng Giá Gói Nông Sản & Dịch Vụ Vận Hành - Mộc Farm",
  description:
    "Minh bạch các gói hộp rau tuần hoàn gia đình, gói cung ứng nguyên liệu nhà hàng và chi phí tư vấn chuyển đổi canh tác hữu cơ.",
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Bảng Giá Dịch Vụ & Cung Ứng Nông Sản"
        description="Lựa chọn gói giải pháp phù hợp với nhu cầu gia đình, doanh nghiệp ẩm thực hoặc nông trại của bạn."
        breadcrumbs={[{ title: "Bảng giá" }]}
        imageUrl="/images/hero/hero-2.jpg"
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="section-title mb-12 text-center sm:mb-16">
            <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
              <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>Bảng Giá Minh Bạch</span>
            </h5>
            <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Gói Giải Pháp Nông Nghiệp Linh Hoạt
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Mộc Farm cam kết chất lượng chuẩn sạch, nguồn gốc minh bạch và mức giá công bằng cho
              cả người tiêu dùng lẫn nông dân.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl p-8 shadow-sm transition-all duration-300",
                  plan.highlighted
                    ? "scale-100 border-2 border-accent bg-cream/70 shadow-xl lg:-translate-y-2"
                    : "border border-border bg-white hover:shadow-md"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-dark shadow-md">
                      Khuyên Dùng Cho Doanh Nghiệp
                    </span>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 border-b border-border pb-4 pt-2">
                    <span className="font-heading text-3xl font-black text-accent sm:text-4xl">
                      {plan.price}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {plan.frequency}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Quyền lợi bao gồm:
                    </p>
                    <ul className="space-y-3 text-xs text-foreground/85 sm:text-sm">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 font-bold text-accent"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-8">
                  <Link
                    href="/lien-he"
                    className={cn(
                      "btn-custom w-full justify-center text-center text-sm font-bold shadow-md",
                      plan.highlighted ? "btn-custom-gold" : "btn-custom-green"
                    )}
                  >
                    <span>{plan.ctaText}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-2xl space-y-2 rounded-2xl border border-border bg-cream/60 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-accent">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>Cam Kết Chất Lượng Tuyệt Đối</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Mộc Farm hỗ trợ chính sách đổi trả 100% hoặc hoàn tiền trong vòng 24h nếu nông sản có
              bất kỳ vấn đề nào về độ tươi và chất lượng đóng gói.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}

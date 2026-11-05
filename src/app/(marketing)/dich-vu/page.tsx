import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { servicesData } from "@/data/services";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Dịch Vụ Nông Nghiệp Hữu Cơ & Giải Pháp Vùng Trồng - Mộc Farm",
  description:
    "Các gói giải pháp nông nghiệp chuyên nghiệp từ Mộc Farm: Canh tác hữu cơ, cung ứng nông sản tươi sạch, chuyển giao kỹ thuật và quản lý nông trại sinh thái.",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Dịch Vụ Nông Nghiệp Mộc Farm"
        description="Giải pháp khép kín từ cải tạo đất, quy hoạch vùng trồng đến thu hoạch và phân phối nông sản an lành."
        breadcrumbs={[{ title: "Dịch vụ" }]}
        imageUrl="/images/hero/hero-2.jpg"
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="space-y-20">
            {servicesData.map((service, index) => {
              const isReversed = index % 2 === 1;
              const formattedNumber = `0${index + 1}`;

              return (
                <div
                  key={service.id}
                  id={service.slug}
                  className={`grid scroll-mt-28 grid-cols-1 items-center gap-10 lg:grid-cols-12 ${
                    isReversed ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  <div className={`relative lg:col-span-6 ${isReversed ? "lg:col-start-7" : ""}`}>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 550px"
                        className="object-cover"
                      />
                      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-dark shadow-md">
                        {formattedNumber}
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-5 lg:col-span-6 ${isReversed ? "lg:col-start-1" : ""}`}>
                    <span className="inline-block rounded-full bg-accent/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
                      Dịch vụ {formattedNumber}
                    </span>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {service.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {service.description}
                    </p>

                    <div className="pt-2">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
                        Đặc điểm nổi bật:
                      </h3>
                      <ul className="space-y-2.5 text-sm text-foreground/85">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 font-bold text-accent"
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4">
                      <Link
                        href="/lien-he"
                        className="btn-custom btn-custom-gold inline-flex text-sm font-bold text-dark shadow-md"
                      >
                        <span>Đăng ký tư vấn giải pháp này</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}

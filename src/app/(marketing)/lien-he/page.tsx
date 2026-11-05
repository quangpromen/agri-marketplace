import React from "react";
import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Liên Hệ Hợp Tác & Tư Vấn Vùng Trồng - Mộc Farm",
  description:
    "Kết nối với Mộc Farm để đặt hàng nông sản hữu cơ, đăng ký tham quan nông trại hoặc nhận tư vấn chuyển đổi canh tác sinh thái.",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Liên Hệ Với Mộc Farm"
        description="Chúng tôi luôn sẵn lòng lắng nghe, trao đổi và đồng hành cùng quý khách hàng trên hành trình sống lành."
        breadcrumbs={[{ title: "Liên hệ" }]}
        imageUrl="/images/hero/hero-1.jpg"
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Cột thông tin liên hệ */}
            <div className="space-y-8 lg:col-span-5">
              <div className="space-y-3">
                <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
                  <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>Kết Nối Trực Tiếp</span>
                </h5>
                <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-foreground sm:text-3xl">
                  Chúng Tôi Luôn Sẵn Sàng Đồng Hành Cùng Bạn
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Dù bạn là người tiêu dùng cần mua nông sản sạch hay chủ trang trại muốn chuyển
                  giao kỹ thuật canh tác, đừng ngần ngại liên hệ với Mộc Farm.
                </p>
              </div>

              <div className="space-y-4">
                <div className="shadow-2xs flex items-start gap-4 rounded-2xl border border-border bg-cream/50 p-5">
                  <div className="shadow-2xs flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-dark">
                    <Phone className="h-5 w-5 text-dark" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Hotline tư vấn</h3>
                    <a
                      href={`tel:${siteConfig.contact.hotline.replace(/\s+/g, "")}`}
                      className="text-base font-bold text-accent hover:underline"
                    >
                      {siteConfig.contact.phoneDisplay}
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Hỗ trợ 24/7 cho các đơn hàng khẩn cấp
                    </p>
                  </div>
                </div>

                <div className="shadow-2xs flex items-start gap-4 rounded-2xl border border-border bg-cream/50 p-5">
                  <div className="shadow-2xs flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-dark">
                    <Mail className="h-5 w-5 text-dark" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Hộp thư điện tử</h3>
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="text-sm font-bold text-accent hover:underline"
                    >
                      {siteConfig.contact.email}
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Phản hồi thư trong vòng tối đa 2 giờ làm việc
                    </p>
                  </div>
                </div>

                <div className="shadow-2xs flex items-start gap-4 rounded-2xl border border-border bg-cream/50 p-5">
                  <div className="shadow-2xs flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-dark">
                    <MapPin className="h-5 w-5 text-dark" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Địa chỉ trụ sở trang trại</h3>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                      {siteConfig.contact.address}
                    </p>
                  </div>
                </div>

                <div className="shadow-2xs flex items-start gap-4 rounded-2xl border border-border bg-cream/50 p-5">
                  <div className="shadow-2xs flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-dark">
                    <Clock className="h-5 w-5 text-dark" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Thời gian mở cửa đón khách
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                      {siteConfig.contact.workingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột form liên hệ */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-cream/60 p-8 shadow-sm sm:p-10">
                <h3 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
                  Gửi Lời Nhắn Đến Kỹ Sư Mộc Farm
                </h3>
                <p className="mb-6 text-xs text-muted-foreground sm:text-sm">
                  Vui lòng điền thông tin bên dưới, chuyên viên nông học của chúng tôi sẽ liên hệ tư
                  vấn trong thời gian sớm nhất.
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

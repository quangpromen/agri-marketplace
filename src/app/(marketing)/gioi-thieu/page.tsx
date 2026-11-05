import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Leaf, HeartHandshake, Award } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { AboutSection } from "@/components/sections/about-section";
import { ApproachSection } from "@/components/sections/approach-section";
import { HistorySection } from "@/components/sections/history-section";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Về Mộc Farm - Hành Trình Nông Nghiệp Hữu Cơ",
  description:
    "Tìm hiểu về câu chuyện khởi nguồn, triết lý canh tác thuận tự nhiên và cam kết nuôi dưỡng đất sống của Mộc Farm.",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Về Chúng Tôi — Mộc Farm"
        description="Nơi tình yêu đất mẹ hòa quyện cùng tư duy nông nghiệp tuần hoàn bền vững vì sức khỏe cộng đồng."
        breadcrumbs={[{ title: "Giới thiệu" }]}
        imageUrl="/images/hero/hero-1.jpg"
      />

      {/* About Section Core */}
      <AboutSection />

      {/* Detailed Philosophy */}
      <section className="border-b border-border bg-white py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted shadow-xl">
                <Image
                  src="/images/about/about-2.jpg"
                  alt="Không gian nông trại sinh thái Mộc Farm"
                  fill
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-6 lg:col-span-6">
              <SectionHeading
                align="left"
                badge="Triết Lý Canh Tác"
                title="Khởi Đầu Từ Niềm Tin Vào Sức Mạnh Tự Nhiên Của Đất Mẹ"
                description="Mộc Farm thành lập với mục tiêu thiết lập lại mối liên kết thuần khiết giữa người nông dân, mảnh đất và người thưởng thức nông sản."
                className="mb-4"
              />

              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Chúng tôi nói không với phân hóa học, không thuốc bảo vệ thực vật tổng hợp, không
                  chất kích thích tăng trưởng và không giống biến đổi gen. Mỗi sản phẩm thu hái từ
                  Mộc Farm là kết tinh của đất lành, nước sạch và sự nhẫn nại của những người nông
                  dân tâm huyết.
                </p>
                <p>
                  Hơn 8 năm qua, Mộc Farm đã kiên trì cải tạo hơn 195 hecta đất đỏ bazan và đất phù
                  sa, đưa hàng tỷ vi sinh vật bản địa trở lại với tầng đất canh tác, tạo tiền đề cho
                  những vụ mùa an lành và giàu giá trị dinh dưỡng.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>100% Thuần tự nhiên</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <HeartHandshake className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>Đồng hành cùng nông dân</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <Leaf className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>Nông nghiệp tuần hoàn</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <Award className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>Minh bạch chất lượng</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Sứ mệnh và Tầm nhìn */}
      <ApproachSection />

      {/* Hành trình phát triển */}
      <HistorySection />
    </>
  );
}

import React from "react";
import Image from "next/image";
import { Leaf, Tractor, UserCheck, Sprout, Globe } from "lucide-react";
import { Container } from "@/components/ui/container";

const features = [
  {
    id: 1,
    title: "Cơ Giới Hóa & Nông Nghiệp Thông Minh",
    icon: Tractor,
  },
  {
    id: 2,
    title: "Kỹ Sư Nông Học Giàu Kinh Nghiệm",
    icon: UserCheck,
  },
  {
    id: 3,
    title: "100% Nông Sản Hữu Cơ Tươi Lành",
    icon: Sprout,
  },
  {
    id: 4,
    title: "Canh Tác Thuận Tự Nhiên Thân Thiện",
    icon: Globe,
  },
];

export function FeaturesSection() {
  return (
    <section className="border-b border-border bg-cream/40 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:gap-12 xl:grid-cols-12">
          {/* Main 9 Columns */}
          <div className="flex flex-col justify-between xl:col-span-9">
            <div className="grid h-full grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
              {/* Left Column Image (col-lg-4) */}
              <div className="lg:col-span-4">
                <div className="relative h-72 min-h-[340px] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg sm:h-96 lg:h-full">
                  <Image
                    src="/images/features/feature-1.jpg"
                    alt="Máy kéo hiện đại hỗ trợ cơ giới hóa đồng ruộng Mộc Farm"
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Right Column Text & 4 Feature Cards (col-lg-8) */}
              <div className="flex flex-col justify-between space-y-6 lg:col-span-8">
                <div>
                  <div className="mb-6 text-left">
                    <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
                      <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span>Vì Sao Chọn Mộc Farm</span>
                    </h5>
                    <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                      Giá Trị Khác Biệt Tạo Nên Sự Tin Cậy
                    </h2>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Chúng tôi giải quyết tận gốc rễ những lo âu về an toàn thực phẩm thông qua quy
                    trình kiểm soát khép kín từ khâu chọn giống bản địa, phục hồi thổ nhưỡng vi sinh
                    đến thu hoạch và chuỗi cung ứng lạnh giao nhanh 24h.
                  </p>
                </div>

                {/* 4 Feature Items  */}
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  {features.map((feat) => {
                    const IconComponent = feat.icon;

                    return (
                      <div
                        key={feat.id}
                        className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="shadow-2xs flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-dark">
                          <IconComponent className="h-6 w-6 text-dark" aria-hidden="true" />
                        </div>
                        <h4 className="text-base font-bold leading-snug text-foreground">
                          {feat.title}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Tall Image */}
          <div className="hidden xl:col-span-3 xl:block">
            <div className="relative h-full min-h-[460px] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <Image
                src="/images/features/feature-2.jpg"
                alt="Bàn tay người nông dân nâng niu nắm đất mùn hữu cơ và mầm non"
                fill
                sizes="300px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

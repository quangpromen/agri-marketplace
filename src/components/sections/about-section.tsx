import React from "react";
import Image from "next/image";
import { Leaf, Sprout } from "lucide-react";
import { Container } from "@/components/ui/container";

export function AboutSection() {
  return (
    <section className="border-b border-border bg-cream/40 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-stretch gap-8 lg:gap-12 xl:grid-cols-12">
          {/* Main 9 Columns */}
          <div className="flex flex-col justify-between xl:col-span-9">
            {/* Section Title */}
            <div className="mb-8 text-left lg:mb-10">
              <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
                <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>Về Mộc Farm</span>
              </h5>
              <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                Khởi Nguồn Từ Đất Mẹ, Nuôi Dưỡng Bằng Đam Mê
              </h2>
            </div>

            {/* Content Row: Col-lg-4 + Col-lg-8 */}
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
              {/* Left Column Image (col-lg-4) */}
              <div className="lg:col-span-4">
                <div className="relative h-72 min-h-[320px] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg sm:h-96 lg:h-full">
                  <Image
                    src="/images/about/about-1.jpg"
                    alt="Bà con nông dân chăm sóc ruộng rau hữu cơ Mộc Farm"
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Right Column Text + 2-box Card (col-lg-8) */}
              <div className="flex flex-col justify-between space-y-6 lg:col-span-8">
                <div>
                  <h3 className="mb-3 text-xl font-bold leading-snug text-foreground sm:text-2xl">
                    Chúng tôi gieo trồng nông sản chất lượng cao bằng quy trình canh tác sinh thái
                    vì một tương lai an lành.
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Mộc Farm ra đời từ niềm trăn trở trước thực trạng lạm dụng hóa chất trên đồng
                    ruộng. Chúng tôi kiên định trả lại sự thuần khiết cho đất mẹ: không phân hóa
                    học, không thuốc trừ sâu tổng hợp và không kích thích tăng trưởng. Mỗi mùa vụ là
                    sự hài hòa giữa tri thức nông học hiện đại và tình yêu thương dành cho nông sản
                    Việt.
                  </p>
                </div>

                {/* 2-box White Card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="space-y-3 p-6 sm:p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Sprout className="h-7 w-7 text-accent" aria-hidden="true" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Canh Tác Bền Vững</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        Chủ động nuôi dưỡng đất sống bằng công nghệ vi sinh bản địa và hệ thống phân
                        ủ hữu cơ tuần hoàn đa tầng.
                      </p>
                    </div>

                    <div className="space-y-3 p-6 sm:p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Leaf className="h-7 w-7 text-accent" aria-hidden="true" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Nông Sản Tươi Lành</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        Thu hái đúng độ chín tự nhiên, kiểm định dư lượng nghiêm ngặt và phân phối
                        lạnh đến tay khách hàng trong 24 giờ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Tall Image */}
          <div className="hidden xl:col-span-3 xl:block">
            <div className="relative h-full min-h-[460px] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <Image
                src="/images/about/about-2.jpg"
                alt="Khung cảnh vườn cây và nhà màng sinh thái Mộc Farm"
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

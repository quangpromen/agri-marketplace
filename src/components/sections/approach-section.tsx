"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Leaf, Target, Eye, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function ApproachSection() {
  const [activeTab, setActiveTab] = useState<"mission" | "vision">("mission");

  return (
    <section className="border-b border-border bg-white py-16 sm:py-20 lg:py-24" id="triet-ly">
      <Container>
        {/* Section Title */}
        <div className="section-title mb-12 text-center sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Sứ Mệnh & Tầm Nhìn</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Định Hướng Phát Triển Bền Vững
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Chúng tôi hành động với niềm tin son sắt: nông nghiệp sạch phải bắt đầu từ việc trả lại
            sự trù phú tự nhiên cho lòng đất mẹ.
          </p>
        </div>

        {/* Content Row: Col-lg-5 + Col-lg-7 */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Image with Experience Badge */}
          <div className="relative lg:col-span-5">
            <div className="relative h-80 min-h-[380px] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg sm:h-96 lg:h-full">
              <Image
                src="/images/approach/approach.jpg"
                alt="Người nông dân Mộc Farm giữa cánh đồng rau hữu cơ xanh mát"
                fill
                sizes="(max-width: 1024px) 100vw, 450px"
                className="object-cover"
              />
              {/* Floating Experience Badge */}
              <div className="absolute left-4 top-4 rounded-2xl border border-border/80 bg-white/95 p-5 text-center shadow-xl backdrop-blur-md sm:left-6 sm:top-6 sm:p-6">
                <div className="font-heading text-4xl font-black text-accent sm:text-5xl">8+</div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
                  Năm Kinh Nghiệm
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Tab Content */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="rounded-2xl border border-border bg-cream/60 p-6 shadow-sm sm:p-10">
              {/* Tab Buttons */}
              <div className="mb-8 flex flex-wrap items-center gap-3" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "mission"}
                  onClick={() => setActiveTab("mission")}
                  className={cn(
                    "btn-custom focus-ring text-sm font-bold transition-all",
                    activeTab === "mission"
                      ? "btn-custom-gold shadow-md"
                      : "border border-border bg-white text-dark hover:bg-white/80"
                  )}
                >
                  Sứ Mệnh Mộc Farm
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "vision"}
                  onClick={() => setActiveTab("vision")}
                  className={cn(
                    "btn-custom focus-ring text-sm font-bold transition-all",
                    activeTab === "vision"
                      ? "btn-custom-gold shadow-md"
                      : "border border-border bg-white text-dark hover:bg-white/80"
                  )}
                >
                  Tầm Nhìn Chiến Lược
                </button>
              </div>

              {/* Tab 1: Mission */}
              {activeTab === "mission" && (
                <div className="animate-in fade-in space-y-6 duration-300">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
                      <Target className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
                      <span>Phụng Sự Nguồn Dinh Dưỡng Thuần Khiết</span>
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Sứ mệnh của Mộc Farm là khôi phục niềm tin của người tiêu dùng đối với nông
                      sản Việt thông qua quy trình canh tác minh bạch, không hóa chất độc hại, đồng
                      thời nâng cao thu nhập và đời sống cho nông hộ bản địa.
                    </p>
                  </div>

                  {/* 2-Column Checkmark Cards */}
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <div className="shadow-2xs space-y-2.5 rounded-xl border border-border bg-white p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Kế hoạch mùa vụ khoa học</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Quản lý tài nguyên nước</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Giám sát nhật ký điện tử</span>
                      </div>
                    </div>

                    <div className="shadow-2xs space-y-2.5 rounded-xl border border-border bg-white p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Nhân sinh khối vi sinh đất</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Thiết bị canh tác hiện đại</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Thu hoạch bảo toàn khoáng chất</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Vision */}
              {activeTab === "vision" && (
                <div className="animate-in fade-in space-y-6 duration-300">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
                      <Eye className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
                      <span>Hệ Sinh Thái Nông Nghiệp Tuần Hoàn Kiểu Mẫu</span>
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Trở thành thương hiệu nông nghiệp hữu cơ chuẩn mực hàng đầu Đông Nam Á, tiên
                      phong mô hình kinh tế tuần hoàn không rác thải và đưa nông sản đặc sản Việt
                      Nam đạt chuẩn vươn tầm thị trường thế giới.
                    </p>
                  </div>

                  {/* 2-Column Checkmark Cards */}
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <div className="shadow-2xs space-y-2.5 rounded-xl border border-border bg-white p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Mở rộng 500+ hecta vùng trồng</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Liên kết chuỗi 1.000 nông hộ</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Chứng nhận hữu cơ quốc tế</span>
                      </div>
                    </div>

                    <div className="shadow-2xs space-y-2.5 rounded-xl border border-border bg-white p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Nâng tầm nông sản đặc sản</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Đổi mới sáng tạo xanh</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check
                          className="h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>Phục hồi đa dạng sinh thái</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

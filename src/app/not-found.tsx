import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <PageHero
          title="Trang Không Tồn Tại (404)"
          description="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển."
          breadcrumbs={[{ title: "Lỗi 404" }]}
          imageUrl="/images/hero/hero-1.jpg"
        />

        <div className="py-20 text-center sm:py-28">
          <Container className="mx-auto max-w-xl space-y-6">
            <h1 className="font-heading text-7xl font-black tracking-tighter text-accent sm:text-9xl">
              404
            </h1>

            <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              Không Tìm Thấy Trang Yêu Cầu
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được thay đổi địa chỉ. Hãy
              quay về trang chủ Mộc Farm để tiếp tục trải nghiệm.
            </p>

            <div className="flex justify-center pt-4">
              <Link
                href="/"
                className="btn-custom btn-custom-gold text-base font-bold text-dark shadow-lg"
              >
                Về lại trang chủ Mộc Farm
              </Link>
            </div>
          </Container>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

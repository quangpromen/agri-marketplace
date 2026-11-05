import React from "react";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/forms/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#181818] py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Đăng Ký Nhận Bản Tin Nông Nghiệp
          </h2>

          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            Nhận thông báo sớm nhất về các mùa vụ nông sản tươi ngon, cẩm nang dinh dưỡng sạch và ưu
            đãi định kỳ dành riêng cho bạn.
          </p>

          <div className="pt-2">
            <NewsletterForm />
          </div>

          <p className="pt-1 text-xs text-gray-400 sm:text-sm">
            Đừng lo lắng, Mộc Farm cam kết bảo mật 100% và tuyệt đối không gửi thư rác.
          </p>
        </div>
      </Container>
    </section>
  );
}

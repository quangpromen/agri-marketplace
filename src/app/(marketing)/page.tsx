import React from "react";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";
import { AboutSection } from "@/components/sections/about-section";
import { HistorySection } from "@/components/sections/history-section";
import { ServicesSection } from "@/components/sections/services-section";
import { ApproachSection } from "@/components/sections/approach-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { FaqSection } from "@/components/sections/faq-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { BlogSection } from "@/components/sections/blog-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";

export default function HomePage() {
  return (
    <>
      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. Thống kê nổi bật */}
      <StatsSection />

      {/* 4. Giới thiệu Mộc Farm */}
      <AboutSection />

      {/* 5. Hành trình phát triển */}
      <HistorySection />

      {/* 6. Dịch vụ nông nghiệp */}
      <ServicesSection />

      {/* 7. Sứ mệnh và tầm nhìn (Triết lý tuần hoàn) */}
      <ApproachSection />

      {/* 8. Vì sao chọn Mộc Farm */}
      <FeaturesSection />

      {/* 9. Dự án tiêu biểu */}
      <ProjectsSection />

      {/* 10. Câu hỏi thường gặp */}
      <FaqSection />

      {/* 11. Đánh giá khách hàng */}
      <TestimonialsSection />

      {/* 12. Bài viết mới */}
      <BlogSection />

      {/* 13. Đăng ký nhận tin */}
      <NewsletterSection />
    </>
  );
}

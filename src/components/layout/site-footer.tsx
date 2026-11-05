import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { footerNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/shared/logo";
import { SocialLinks } from "@/components/shared/social-links";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#181818] pb-8 pt-16 text-gray-300">
      <Container>
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: Thông tin văn phòng & liên hệ */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold tracking-tight text-white">Văn Phòng & Liên Hệ</h4>

            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <span className="leading-relaxed">{siteConfig.contact.address}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <a
                  href={`tel:${siteConfig.contact.hotline.replace(/\s+/g, "")}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-accent"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <span className="mb-2 block text-xs font-medium text-gray-400">Mạng xã hội:</span>
              <SocialLinks
                isLight
                iconClassName="h-9 w-9 text-xs rounded-full bg-white/10 hover:bg-accent hover:text-dark transition-colors"
              />
            </div>
          </div>

          {/* Cột 2: Giờ làm việc */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold tracking-tight text-white">Giờ Làm Việc</h4>

            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <h6 className="font-semibold text-white">Thứ Hai – Thứ Sáu</h6>
                <p className="mt-0.5 text-xs text-gray-400">
                  08:00 – 18:00 (Giờ tiếp nhận đơn & tư vấn)
                </p>
              </div>

              <div>
                <h6 className="font-semibold text-white">Thứ Bảy</h6>
                <p className="mt-0.5 text-xs text-gray-400">08:00 – 12:00 (Giao nông sản sáng)</p>
              </div>

              <div>
                <h6 className="font-semibold text-accent">Chủ Nhật</h6>
                <p className="mt-0.5 text-xs text-gray-400">Nghỉ (Đồng ruộng nghỉ ngơi định kỳ)</p>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs text-gray-400">
                <Clock className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>Hỗ trợ hotline 24/7 cho sự cố đơn hàng</span>
              </div>
            </div>
          </div>

          {/* Cột 3: Liên kết nhanh */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold tracking-tight text-white">Liên Kết Nhanh</h4>

            <ul className="space-y-2.5 text-sm">
              {footerNavigation.quickLinks.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="focus-ring flex items-center gap-1.5 rounded text-gray-300 transition-colors hover:text-accent"
                  >
                    <span className="text-xs text-accent">›</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/cau-hoi-thuong-gap"
                  className="focus-ring flex items-center gap-1.5 rounded text-gray-300 transition-colors hover:text-accent"
                >
                  <span className="text-xs text-accent">›</span>
                  <span>Câu hỏi thường gặp</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/bang-gia"
                  className="focus-ring flex items-center gap-1.5 rounded text-gray-300 transition-colors hover:text-accent"
                >
                  <span className="text-xs text-accent">›</span>
                  <span>Bảng giá & Gói dịch vụ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Thư viện ảnh nông trại (Gallery) */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold tracking-tight text-white">Thư Viện Nông Trại</h4>

            <div className="grid grid-cols-3 gap-2">
              {footerNavigation.gallery.map((photo, i) => (
                <div
                  key={i}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/5"
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    sizes="100px"
                    className="group-hover:scale-115 object-cover transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="line-clamp-2 px-1 text-center text-[10px] font-medium text-white">
                      {photo.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              Hình ảnh thực tế từ các khu vườn hữu cơ Mộc Farm.
            </p>
          </div>
        </div>

        {/* Copyright Row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-gray-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo isLight className="text-base" />
            <span className="text-gray-500">|</span>
            <span>&copy; {new Date().getFullYear()} Mộc Farm. Toàn bộ bản quyền được bảo hộ.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/gioi-thieu" className="transition-colors hover:text-accent">
              Về chúng tôi
            </Link>
            <Link href="/dich-vu" className="transition-colors hover:text-accent">
              Dịch vụ
            </Link>
            <Link href="/lien-he" className="transition-colors hover:text-accent">
              Liên hệ
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

import { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Mộc Farm",
  tagline: "Gieo mầm xanh – Nuôi dưỡng tương lai",
  description:
    "Mộc Farm - Hệ sinh thái nông nghiệp sạch, canh tác hữu cơ bền vững và cung ứng nông sản an lành hàng đầu Việt Nam. Thuận tự nhiên, trọn an lành cho mọi gia đình.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://mocfarm.vn",
  ogImage: "/images/hero/hero-1.jpg",
  links: {
    facebook: "https://facebook.com/mocfarm.vn",
    zalo: "https://zalo.me/0912345678",
    youtube: "https://youtube.com/@mocfarm",
  },
  contact: {
    address: "Thôn Đa Lộc, Xã Đạ Nhim, Huyện Lạc Dương, Tỉnh Lâm Đồng, Việt Nam",
    hotline: "0912 345 678",
    phoneDisplay: "0912 345 678",
    email: "lienhe@mocfarm.vn",
    workingHours: "Thứ Hai - Thứ Bảy: 08:00 - 18:00",
  },
};

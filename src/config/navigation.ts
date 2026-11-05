import { NavigationItem } from "@/types";

export const mainNavigation: NavigationItem[] = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Giới thiệu",
    href: "/gioi-thieu",
  },
  {
    title: "Dịch vụ",
    href: "/dich-vu",
  },
  {
    title: "Dự án",
    href: "/du-an",
  },
  {
    title: "Bài viết",
    href: "/bai-viet",
  },
  {
    title: "Trang",
    href: "#",
    children: [
      {
        title: "Đội ngũ",
        href: "/doi-ngu",
        description: "Chuyên gia nông học và kỹ sư canh tác",
      },
      {
        title: "Bảng giá",
        href: "/bang-gia",
        description: "Gói cung ứng nông sản và giải pháp chuyển đổi",
      },
      {
        title: "Câu hỏi thường gặp",
        href: "/cau-hoi-thuong-gap",
        description: "Giải đáp thắc mắc về tiêu chuẩn và quy trình",
      },
      {
        title: "Đánh giá khách hàng",
        href: "/#danh-gia",
        description: "Cảm nhận từ đầu bếp, đối tác và gia đình",
      },
    ],
  },
  {
    title: "Liên hệ",
    href: "/lien-he",
  },
];

export const footerNavigation = {
  about: [
    { title: "Về Mộc Farm", href: "/gioi-thieu" },
    { title: "Đội ngũ chuyên gia", href: "/doi-ngu" },
    { title: "Hành trình phát triển", href: "/gioi-thieu#hanh-trinh" },
    { title: "Bảng giá cung ứng", href: "/bang-gia" },
    { title: "Hỏi đáp thường gặp", href: "/cau-hoi-thuong-gap" },
  ],
  services: [
    { title: "Canh tác hữu cơ chuẩn quốc tế", href: "/dich-vu#canh-tac-huu-co" },
    { title: "Cung cấp nông sản sạch", href: "/dich-vu#cung-cap-nong-san-sach" },
    { title: "Tư vấn kỹ thuật nông nghiệp", href: "/dich-vu#tu-van-ky-thuat-nong-nghiep" },
    { title: "Quản lý nông trại sinh thái", href: "/dich-vu#quan-ly-nong-trai" },
    { title: "Kiểm tra chất lượng đất & nước", href: "/dich-vu#kiem-tra-chat-luong-dat" },
  ],
  quickLinks: [
    { title: "Giới thiệu", href: "/gioi-thieu" },
    { title: "Dịch vụ", href: "/dich-vu" },
    { title: "Dự án tiêu biểu", href: "/du-an" },
    { title: "Bản tin nông nghiệp", href: "/bai-viet" },
    { title: "Liên hệ", href: "/lien-he" },
  ],
  gallery: [
    { title: "Rau xanh hữu cơ", src: "/images/gallery/gallery-1.jpg" },
    { title: "Cà chua chín mọng", src: "/images/gallery/gallery-2.jpg" },
    { title: "Mầm xanh tự nhiên", src: "/images/gallery/gallery-3.jpg" },
    { title: "Dâu tây Đà Lạt", src: "/images/gallery/gallery-4.jpg" },
    { title: "Đồi chè sinh thái", src: "/images/gallery/gallery-5.jpg" },
    { title: "Thu hoạch củ quả", src: "/images/gallery/gallery-6.jpg" },
  ],
};

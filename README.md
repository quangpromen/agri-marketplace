<div align="center">

# 🌱 Mộc Farm — Hệ Sinh Thái Nông Nghiệp & Nông Sản Hữu Cơ Việt Nam

**"Gieo mầm xanh – Nuôi dưỡng tương lai"**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://agri-marketplace.vercel.app)

<p align="center">
  Nền tảng website giới thiệu thương hiệu, dịch vụ canh tác bền vững, dự án vùng trồng sinh thái và cung ứng nông sản hữu cơ chuẩn quốc tế của <strong>Mộc Farm</strong>.
</p>

[🌐 Xem Bản Demo Trực Tuyến (Vercel)](https://agri-marketplace.vercel.app) · [🐞 Báo Lỗi](https://github.com/quangpromen/agri-marketplace/issues) · [✨ Đề Xuất Tính Năng](https://github.com/quangpromen/agri-marketplace/issues)

</div>

---

## 📖 Tổng Quan Dự Án

**Mộc Farm** là giải pháp giao diện web hiện đại dành cho doanh nghiệp nông nghiệp sạch và chuỗi cung ứng nông sản hữu cơ tại Việt Nam. Dự án được thiết kế với ngôn ngữ thị giác mộc mạc nhưng cao cấp, tôn vinh vẻ đẹp của ruộng đồng Việt Nam kết hợp cùng kiến trúc kỹ thuật chuẩn Production trên nền tảng **Next.js 14 App Router**.

### Điểm nổi bật về sản phẩm & kỹ thuật:
- **Kiến trúc Server-First:** Ưu tiên tối đa **React Server Components (RSC)**, chỉ tách `"use client"` tại các lá tương tác (Slider, Counter, Tabs, Accordion, Drawer, Form) giúp giảm thiểu tối đa bundle size JavaScript.
- **Trải nghiệm tương tác mượt mà:** Hero Slider toàn khung hình, hiệu ứng đếm số liệu thống kê (Counter Animation) với `IntersectionObserver`, Timeline ngang hành trình phát triển, Carousel dịch vụ & đánh giá khách hàng, Tabs dự án tiêu biểu và FAQ Accordion.
- **Chuẩn tiếp cận WCAG 2.2 AA:** Độ tương phản màu sắc đạt chuẩn, hỗ trợ đầy đủ điều hướng bàn phím (`focus-visible`, `Escape`, `aria-expanded`, `aria-controls`), vùng chạm tối thiểu `44×44px` trên thiết bị cảm ứng và tôn trọng cấu hình `prefers-reduced-motion` của hệ điều hành.
- **Tối ưu SEO & Core Web Vitals:** Tích hợp Metadata động theo từng trang, Open Graph, Canonical URL, cấu trúc dữ liệu **JSON-LD** (`Organization`, `LocalBusiness`, `BreadcrumbList`, `Article`), cùng `sitemap.xml` và `robots.txt` tự động.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

| Danh mục | Công nghệ | Mô tả |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) | App Router, React Server Components, Static Site Generation (SSG) |
| **Ngôn ngữ** | [TypeScript 5](https://www.typescriptlang.org/) | Kiểm tra kiểu tĩnh nghiêm ngặt (`strict: true`, 0 `any`) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Kết hợp hệ thống Semantic Design Tokens & CSS Variables |
| **Typography** | `Be Vietnam Pro` | Tối ưu hiển thị dấu tiếng Việt qua `next/font/google` |
| **Icons** | [Lucide React](https://lucide.dev/) | Hệ thống biểu tượng vector sắc nét, đồng nhất |
| **Utilities** | `clsx`, `tailwind-merge` | Quản lý và hợp nhất class CSS linh hoạt |
| **Code Quality** | ESLint, Prettier | Chuẩn hóa quy tắc code và tự động sắp xếp class Tailwind |
| **Deployment** | [Vercel](https://vercel.com/) | CI/CD tự động từ GitHub, tối ưu hóa hình ảnh ở Edge Network |

---

## 🗺️ Hệ Thống Trang & Điều Hướng (Sitemap)

Dự án bao gồm **21 static pages** được biên dịch sẵn (Pre-rendered SSG), đảm bảo tốc độ phản hồi tức thì:

| Đường dẫn (Route) | Tên trang | Nội dung chính |
| :--- | :--- | :--- |
| `/` | **Trang chủ** | 14 phân khu: Hero Slider, Thống kê, Giới thiệu, Timeline lịch sử, Dịch vụ, Sứ mệnh/Tầm nhìn, Ưu thế, Dự án, FAQ, Đánh giá, Bài viết, Bản tin |
| `/gioi-thieu` | **Giới thiệu** | Câu chuyện Mộc Farm, triết lý canh tác thuận tự nhiên, hành trình phát triển và đội ngũ nòng cốt |
| `/dich-vu` | **Dịch vụ** | 6 giải pháp nông nghiệp bền vững, quy trình hợp tác 4 bước và câu hỏi thường gặp |
| `/du-an` | **Dự án** | Danh mục các vùng trồng sinh thái tiêu biểu từ Đà Lạt, Mộc Châu đến Đồng bằng sông Cửu Long |
| `/du-an/[slug]` | **Chi tiết dự án** | Thông số vùng trồng, quy mô hecta, thách thức, giải pháp kỹ thuật và kết quả thực tế |
| `/bai-viet` | **Bài viết** | Cẩm nang kiến thức nông nghiệp hữu cơ, kỹ thuật nuôi dưỡng đất và xu hướng tiêu dùng xanh |
| `/bai-viet/[slug]` | **Chi tiết bài viết** | Nội dung chuyên sâu kèm Schema `Article`, thông tin tác giả và gợi ý bài viết liên quan |
| `/doi-ngu` | **Đội ngũ** | Hồ sơ các kỹ sư nông học, chuyên gia thổ nhưỡng và quản lý chất lượng tại Mộc Farm |
| `/bang-gia` | **Bảng giá** | Các gói cung ứng nông sản định kỳ cho gia đình, chuỗi nhà hàng và gói tư vấn chuyển đổi hữu cơ |
| `/cau-hoi-thuong-gap` | **Hỏi đáp (FAQ)** | Giải đáp chi tiết về chứng nhận hữu cơ, quy trình thu hoạch và chính sách giao nhận |
| `/lien-he` | **Liên hệ** | Biểu mẫu liên hệ có kiểm tra dữ liệu (Validation), thông tin nông trại, hotline và giờ làm việc |
| `/_not-found` | **Trang 404** | Giao diện điều hướng thân thiện khi đường dẫn không tồn tại |

---

## 🎨 Hệ Thống Thiết Kế (Design System)

Bảng màu của **Mộc Farm** được lấy cảm hứng từ sắc thái tự nhiên của rừng cây, mầm non và mùa lúa chín tại Việt Nam:

| Token | Mã màu (Hex) | Vai trò sử dụng |
| :--- | :---: | :--- |
| **Forest Green (Primary)** | `#315C3B` | Màu thương hiệu chủ đạo, tiêu đề nhấn, trạng thái active |
| **Sprout Green (Secondary)** | `#8BAE66` | Nhãn phụ, đường viền sinh thái, thành phần bổ trợ |
| **Harvest Gold (Accent)** | `#D9A441` | Nút hành động (CTA), huy hiệu số thứ tự, điểm nhấn tương tác |
| **Warm Cream (Background)** | `#F7F3E8` | Nền phân khu xen kẽ mang lại cảm giác ấm áp, mộc mạc |
| **Charcoal Dark** | `#181818` | Header khi cuộn, khối đăng ký bản tin và Footer |
| **Deep Forest (Foreground)** | `#16251B` | Màu chữ chính đảm bảo độ tương phản cao trên nền sáng |

---

## 📂 Cấu Trúc Thư Mục

```text
agri-marketplace/
├── public/
│   └── images/                 # 37 hình ảnh nông nghiệp chất lượng cao phân theo từng phân khu
│       ├── hero/               # Ảnh nền toàn khung cho Hero Slider
│       ├── about/              # Ảnh thực tế nông trại và thu hoạch
│       ├── history/            # Ảnh toàn cảnh hành trình phát triển
│       ├── services/           # Ảnh minh họa 6 dịch vụ cốt lõi
│       ├── features/           # Ảnh điểm nổi bật & kiểm định chất lượng
│       ├── approach/           # Ảnh sứ mệnh & tầm nhìn canh tác
│       ├── projects/           # Ảnh các dự án vùng trồng tiêu biểu
│       ├── faq/                # Ảnh minh họa khu vực hỏi đáp
│       ├── testimonials/       # Ảnh chân dung khách hàng & đối tác
│       ├── team/               # Ảnh chân dung đội ngũ kỹ sư nông học
│       ├── blog/               # Ảnh bìa bài viết chuyên môn
│       └── gallery/            # Bộ sưu tập ảnh nông trại tại Footer
├── src/
│   ├── app/
│   │   ├── (marketing)/        # Route group chia sẻ chung Header & Footer
│   │   │   ├── page.tsx        # Trang chủ (14 sections)
│   │   │   ├── gioi-thieu/     # Trang Giới thiệu
│   │   │   ├── dich-vu/        # Trang Dịch vụ
│   │   │   ├── du-an/          # Danh sách & chi tiết Dự án ([slug])
│   │   │   ├── bai-viet/       # Danh sách & chi tiết Bài viết ([slug])
│   │   │   ├── doi-ngu/        # Trang Đội ngũ chuyên gia
│   │   │   ├── bang-gia/       # Trang Bảng giá dịch vụ & nông sản
│   │   │   ├── cau-hoi-thuong-gap/ # Trang Câu hỏi thường gặp
│   │   │   └── lien-he/        # Trang Liên hệ & biểu mẫu
│   │   ├── globals.css         # CSS Variables, Design Tokens & Custom Components
│   │   ├── layout.tsx          # Root Layout (lang="vi", Font, JSON-LD Schema)
│   │   ├── loading.tsx         # Trạng thái tải trang
│   │   ├── not-found.tsx       # Trang lỗi 404
│   │   ├── robots.ts           # Cấu hình robots.txt tự động
│   │   └── sitemap.ts          # Cấu hình sitemap.xml tự động
│   ├── components/
│   │   ├── layout/             # SiteHeader, MainNavigation, MobileNavigation, SiteFooter
│   │   ├── sections/           # Các phân khu chức năng trên trang chủ & trang con
│   │   ├── shared/             # Logo, PageHero, SectionHeading, BackToTop, JsonLd
│   │   └── ui/                 # Các thành phần UI tái sử dụng (Button, Accordion,...)
│   ├── config/
│   │   ├── site.ts             # Cấu hình thương hiệu, liên hệ, mạng xã hội tập trung
│   │   └── navigation.ts       # Cấu trúc menu điều hướng và dropdown
│   ├── data/                   # Dữ liệu tiếng Việt chuẩn hóa kiểu tĩnh (Type-safe)
│   ├── lib/                    # Hàm tiện ích cn(), trình tạo Metadata SEO
│   └── types/                  # Định nghĩa toàn bộ TypeScript Interfaces
├── .env.example                # Mẫu cấu hình biến môi trường
├── next.config.mjs             # Cấu hình Next.js
├── tailwind.config.ts          # Cấu hình hệ thống token Tailwind CSS
└── tsconfig.json               # Cấu hình TypeScript
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu cầu hệ thống
- **Node.js** `>= 18.17.0`
- **npm** `>= 9.0.0`

### 2. Clone dự án & cài đặt thư viện
```bash
git clone https://github.com/quangpromen/agri-marketplace.git
cd agri-marketplace
npm install
```

### 3. Thiết lập biến môi trường
Sao chép file `.env.example` sang `.env.local`:
```bash
cp .env.example .env.local
```
Cập nhật giá trị URL trong `.env.local` (nếu cần):
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

### 4. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```
Mở trình duyệt và truy cập: `http://localhost:3000`

### 5. Các lệnh kiểm tra & đóng gói Production
```bash
# Kiểm tra kiểu dữ liệu TypeScript
npm run type-check

# Kiểm tra quy tắc code với ESLint
npm run lint

# Định dạng toàn bộ mã nguồn với Prettier
npm run format

# Đóng gói bản dựng Production (SSG)
npm run build

# Khởi chạy máy chủ Production
npm run start
```

---

## ☁️ Triển Khai (Deployment)

Dự án được tối ưu sẵn để triển khai tức thì trên **Vercel**:
1. Kết nối kho lưu trữ GitHub `quangpromen/agri-marketplace` vào bảng điều khiển Vercel.
2. Thiết lập biến môi trường `NEXT_PUBLIC_SITE_URL` trỏ về tên miền chính thức trên Vercel.
3. Mỗi khi có lệnh `git push` lên nhánh `main`, Vercel sẽ tự động kiểm tra kiểu tĩnh, biên dịch toàn bộ 21 trang tĩnh và cập nhật lên hệ thống CDN toàn cầu.

---

<div align="center">
  <p>Phát triển với tâm huyết vì nền nông nghiệp xanh bền vững Việt Nam — <strong>Mộc Farm</strong> © 2026</p>
</div>

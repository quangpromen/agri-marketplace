# Mộc Farm — Website Nông Nghiệp & Nông Sản Hữu Cơ Việt Nam

Dự án xây dựng nền tảng website cho thương hiệu **Mộc Farm** — tiên phong trong nông nghiệp sạch, canh tác tuần hoàn bền vững và cung ứng nông sản an lành tại Việt Nam.

Website được định hình bố cục và trải nghiệm lấy cảm hứng từ cấu trúc phân cấp thông tin hiện đại của template quốc tế Agrovia, đồng thời áp dụng triệt để bộ quy chuẩn trí tuệ thiết kế **UX/UI Pro Max** kết hợp bản sắc văn hóa ruộng đồng Việt Nam.

---

## 1. Mục Tiêu Dự Án

- **Bản sắc thương hiệu:** Thể hiện trọn vẹn thông điệp *"Gieo mầm xanh – Nuôi dưỡng tương lai"*, mang tinh thần mộc mạc, gần gũi nhưng chuyên nghiệp và đáng tin cậy.
- **Kiến trúc hiện đại:** Xây dựng trên nền tảng Next.js App Router chuẩn production, mã nguồn dạng React Server Components (RSC) mặc định, tối thiểu hóa JavaScript client.
- **Trải nghiệm người dùng vượt trội:** Đạt chuẩn Accessibility WCAG 2.2 AA, thân thiện với thiết bị cảm ứng (Touch-first), tối ưu hóa Core Web Vitals (CLS < 0.1, LCP cao).
- **Hệ thống Design System chặt chẽ:** Quản lý màu sắc và kiểu chữ qua CSS Variables và Semantic Design Tokens 3 lớp, không hard-code mã màu.

---

## 2. Công Nghệ Sử Dụng

- **Framework:** Next.js (App Router, React 18)
- **Ngôn ngữ:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS kết hợp CSS Custom Properties (Variables)
- **Icons:** Lucide React (SVG nhẹ, stroke width 1.5 - 2px đồng nhất, accessible)
- **Class Utilities:** `clsx`, `tailwind-merge`
- **Typography:** `Be Vietnam Pro` (tối ưu hóa 100% tiếng Việt qua `next/font/google`)
- **Code Quality:** ESLint, Prettier, TypeScript Compiler

---

## 3. Cài Đặt & Phát Triển

### Yêu cầu môi trường
- Node.js >= 18.17.0
- npm >= 9.0.0

### Cài đặt dependencies
Cài đặt dependencies với cache nội bộ dự án:
```bash
npm install --cache .cache/npm
```

### Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### Kiểm tra cú pháp (Lint)
```bash
npm run lint
```

### Kiểm tra kiểu dữ liệu tĩnh (Type-check)
```bash
npm run type-check
```

### Đóng gói Production Build
```bash
npm run build
```

### Chạy Production Server
```bash
npm run start
```

---

## 4. Biến Môi Trường

Tạo file `.env.local` từ file mẫu `.env.example`:
```env
NEXT_PUBLIC_SITE_URL=https://mocfarma.vn
NEXT_PUBLIC_APP_ENV=development
```

---

## 5. Cấu Trúc Thư Mục Dự Án

```
agri-marketplace/
├── .cache/                     # Local cache nội bộ
├── public/
│   ├── images/                 # Ảnh nông nghiệp thực tế chất lượng cao (37 ảnh phân loại theo section)
│   │   ├── hero/               # Ảnh banner toàn cảnh slider
│   │   ├── about/              # Ảnh giới thiệu nông trại
│   │   ├── history/            # Ảnh toàn cảnh hành trình
│   │   ├── services/           # Ảnh dịch vụ canh tác
│   │   ├── features/           # Ảnh điểm nổi bật & công nghệ
│   │   ├── approach/           # Ảnh sứ mệnh & tầm nhìn
│   │   ├── projects/           # Ảnh dự án tiêu biểu
│   │   ├── faq/                # Ảnh hỏi đáp nông trại
│   │   ├── testimonials/       # Chân dung đối tác & khách hàng
│   │   ├── team/               # Chân dung đội ngũ kỹ sư
│   │   ├── blog/               # Ảnh cẩm nang nông nghiệp
│   │   └── gallery/            # Ảnh lưới footer nông trại
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (marketing)/        # Route group tiếp thị chung layout
│   │   │   ├── layout.tsx      # Header & Footer wrapper
│   │   │   ├── page.tsx        # Trang chủ với 14 section skeleton
│   │   │   ├── gioi-thieu/     # Trang giới thiệu Mộc Farm
│   │   │   ├── dich-vu/        # Trang danh mục 6 dịch vụ cốt lõi
│   │   │   ├── du-an/          # Danh sách & chi tiết dự án (/du-an/[slug])
│   │   │   ├── bai-viet/       # Cẩm nang & chi tiết bài viết (/bai-viet/[slug])
│   │   │   ├── doi-ngu/        # Đội ngũ kỹ sư nông học
│   │   │   ├── bang-gia/       # Bảng giá gói nông sản & dịch vụ
│   │   │   ├── cau-hoi-thuong-gap/ # FAQ accordion accessible
│   │   │   └── lien-he/        # Form liên hệ & thông tin nông trại
│   │   ├── globals.css         # Design tokens & CSS variables
│   │   ├── layout.tsx          # Root layout (lang="vi", Font setup, Schema JSON-LD)
│   │   ├── loading.tsx         # Skeleton loading toàn trang
│   │   ├── not-found.tsx       # Trang lỗi 404 thân thiện
│   │   ├── robots.ts           # Cấu hình tự động robots.txt
│   │   └── sitemap.ts          # Cấu hình tự động sitemap.xml
│   ├── components/
│   │   ├── layout/             # SiteHeader, MainNav, MobileNav, SiteFooter
│   │   ├── sections/           # 12 components section riêng biệt cho trang chủ
│   │   ├── ui/                 # Atomic UI primitives: Button, Card, Badge, Accordion,...
│   │   └── shared/             # Logo, Breadcrumb, PageHero, SocialLinks
│   ├── config/
│   │   ├── site.ts             # Thông tin thương hiệu, hotline, địa chỉ
│   │   └── navigation.ts       # Cấu trúc menu điều hướng tập trung
│   ├── data/                   # Typed mock data tiếng Việt thuần khiết
│   │   ├── services.ts
│   │   ├── projects.ts
│   │   ├── posts.ts
│   │   ├── team.ts
│   │   ├── testimonials.ts
│   │   ├── faqs.ts
│   │   └── stats.ts
│   ├── lib/
│   │   ├── utils.ts            # Class helper cn()
│   │   ├── metadata.ts         # SEO metadata generator helper
│   │   └── constants.ts
│   └── types/
│       └── index.ts            # Định nghĩa toàn bộ TypeScript Interfaces
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Quy Ước Lập Trình

### 6.1. Quy ước Component
- **Server Components mặc định:** Tất cả các component trong `src/app` và `src/components/sections` là React Server Components. Không thêm `"use client"` trừ khi component cần quản lý state hoặc sự kiện tương tác (`MobileNavigation`, `Accordion`).
- **Semantic HTML:** Đảm bảo duy nhất 1 thẻ `h1` trên mỗi trang, các section dùng `h2`, thẻ con dùng `h3`.
- **Accessibility:**
  - Vùng chạm (Touch target) đạt tối thiểu `44x44px` trên di động.
  - Vòng chỉ báo bàn phím (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
  - Biểu tượng trang trí có `aria-hidden="true"`.
  - Icon-only button luôn có `aria-label`.
- **Style Utility:** Dùng helper `cn(...)` từ `@/lib/utils` kết hợp `clsx` và `tailwind-merge`.

### 6.2. Quy ước Thêm Dữ Liệu
- Toàn bộ dữ liệu hiển thị được định nghĩa trong `src/data/*.ts` với kiểu dữ liệu chặt chẽ từ `src/types/index.ts`.
- Tuyệt đối không hard-code dữ liệu nội dung, số điện thoại, email hoặc địa chỉ rải rác bên trong file JSX.
- Khi thêm mới một dự án hoặc bài viết, chỉ cần khai báo thêm một object trong `src/data/projects.ts` hoặc `src/data/posts.ts`; hệ thống sẽ tự động sinh dynamic route, static params và sitemap.

---

## 7. Áp Dụng Bộ Tiêu Chuẩn UX/UI Pro Max

Dự án tuân thủ nghiêm ngặt các nguyên tắc thiết kế từ kho tri thức **UX/UI Pro Max**:
1. **Accessibility (WCAG 2.2 AA):** Đảm bảo độ tương phản màu sắc $\ge 4.5:1$, hỗ trợ điều hướng bàn phím đầy đủ, tôn trọng `prefers-reduced-motion`.
2. **Typography & Bản sắc:** Sử dụng font chữ **Be Vietnam Pro** với phân cấp kích thước, khoảng cách dòng `1.5 - 1.75` giúp trải nghiệm đọc nhẹ nhàng, dễ chịu.
3. **Màu sắc Semantic:** Bảng màu nông nghiệp Việt Nam:
   - Primary: `#315C3B` (Xanh lá rừng đậm)
   - Secondary: `#8BAE66` (Xanh mầm non hữu cơ)
   - Accent: `#D9A441` (Vàng lúa chín mùa gặt)
   - Cream: `#F7F3E8` (Be ấm mộc mạc)
   - Foreground: `#16251B` (Xanh đen tự nhiên tương phản cao)

---

## 8. Quy Tắc Bảo Vệ Repository Kỹ Năng Local

- Thư mục kỹ năng `E:\RepoSkill` được quản lý ở chế độ **Read-Only**.
- Dự án không thực thi bất kỳ script nào gây ảnh hưởng hoặc ghi đè ra ngoài phạm vi thư mục hiện tại (`E:\Code\agri-marketplace`).
- Không có bất kỳ dependency hoặc package nào được cài đặt ở chế độ toàn cục (global). Toàn bộ thư viện và cache lưu trữ cục bộ bên trong thư mục dự án.


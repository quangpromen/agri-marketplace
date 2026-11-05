import fs from "node:fs";
import path from "node:path";

const targetDir = path.resolve("./public/images/placeholder");
fs.mkdirSync(targetDir, { recursive: true });

function createSvg(title, subtitle, bg1 = "#315C3B", bg2 = "#5F8F58") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#g)" rx="12" />
  <circle cx="300" cy="190" r="70" fill="#F7F3E8" opacity="0.15" />
  <path d="M300 140 C270 170 260 210 260 240 C260 270 285 290 300 290 C315 290 340 270 340 240 C340 210 330 170 300 140 Z" fill="#F7F3E8" opacity="0.9" />
  <path d="M300 160 L300 270" stroke="${bg1}" stroke-width="4" stroke-linecap="round" />
  <text x="300" y="340" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${title}</text>
  <text x="300" y="375" font-family="system-ui, sans-serif" font-size="14" fill="#F7F3E8" text-anchor="middle" opacity="0.9">${subtitle}</text>
</svg>`;
}

const files = [
  { name: "about-farm.svg", title: "Nông Trại Mộc Farm", subtitle: "Mô hình sinh thái đa tầng" },
  { name: "approach-farm.svg", title: "Thuận Theo Tự Nhiên", subtitle: "Canh tác không hóa chất" },
  { name: "service-1.svg", title: "Canh Tác Hữu Cơ", subtitle: "Chuẩn USDA Organic & PGS" },
  { name: "service-2.svg", title: "Cung Cấp Nông Sản Sạch", subtitle: "Thu hoạch trong ngày" },
  { name: "service-3.svg", title: "Tư Vấn Kỹ Thuật", subtitle: "Chuyển giao công nghệ vi sinh" },
  { name: "service-4.svg", title: "Quản Lý Nông Trại", subtitle: "Số hóa vận hành nông trại" },
  { name: "service-5.svg", title: "Kiểm Tra Đất & Nước", subtitle: "Xét nghiệm nông học chuyên sâu" },
  { name: "service-6.svg", title: "Bao Tiêu Nông Sản", subtitle: "Liên kết chuỗi giá trị bền vững" },
  { name: "project-1.svg", title: "Trang Trại Đà Lạt", subtitle: "25 Hecta Rau Ôn Đới Sinh Thái" },
  { name: "project-2.svg", title: "Tuần Hoàn Mộc Châu", subtitle: "40 Hecta Chè & Mận Hữu Cơ" },
  { name: "project-3.svg", title: "Lúa Tôm Mekong", subtitle: "100 Hecta Lúa ST25 Sinh Thái" },
  { name: "project-4.svg", title: "Vườn Bưởi Bến Tre", subtitle: "30 Hecta Bưởi Da Xanh Xuất Khẩu" },
  { name: "team-1.svg", title: "KS. Nguyễn Văn Tuấn", subtitle: "Giám đốc Kỹ thuật" },
  { name: "team-2.svg", title: "ThS. Trần Thị Mai", subtitle: "Chuyên gia Thổ nhưỡng" },
  { name: "team-3.svg", title: "KS. Lê Hoàng Phúc", subtitle: "Vận hành Nông trại" },
  { name: "team-4.svg", title: "Nguyễn Thị Thanh Hương", subtitle: "Giám đốc Chất lượng" },
  { name: "client-1.svg", title: "Nhà Hàng Mộc Việt", subtitle: "Đối tác ẩm thực cao cấp" },
  { name: "client-2.svg", title: "Thực Phẩm Sạch An Tâm", subtitle: "Chuỗi bán lẻ uy tín" },
  { name: "client-3.svg", title: "Khách Hàng Gia Đình", subtitle: "Hộp rau tuần hoàn" },
  { name: "blog-1.svg", title: "Phân Biệt Rau Hữu Cơ", subtitle: "Mẹo hay tiêu dùng sạch" },
  { name: "blog-2.svg", title: "Nuôi Dưỡng Đất Sống", subtitle: "Cải tạo đất bằng vi sinh bản địa" },
  { name: "blog-3.svg", title: "Nông Sản Mùa Thu Đông", subtitle: "Hương vị cao nguyên Tây Nguyên" },
  { name: "author-1.svg", title: "Tác Giả Tuấn", subtitle: "Ban Kỹ thuật" },
  { name: "author-2.svg", title: "Tác Giả Mai", subtitle: "Chuyên gia Thổ nhưỡng" },
  { name: "author-3.svg", title: "Tác Giả Phúc", subtitle: "Vùng trồng Đà Lạt" },
];

for (const f of files) {
  const filePath = path.join(targetDir, f.name);
  fs.writeFileSync(filePath, createSvg(f.title, f.subtitle));
}

console.log(`Successfully generated ${files.length} placeholder SVGs.`);


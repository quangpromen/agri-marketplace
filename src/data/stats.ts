import { MetricStat, HistoryMilestone, CoreFeature } from "@/types";

export const statsData: MetricStat[] = [
  {
    id: "vung-trong",
    value: "195+",
    label: "Hecta Vùng Trồng",
    description: "Quy hoạch vùng trồng hữu cơ tại Lâm Đồng, Sơn La, Bến Tre và Cà Mau.",
  },
  {
    id: "nong-ho",
    value: "80+",
    label: "Nông Hộ Liên Kết",
    description: "Hợp tác xã và bà con nông dân đồng hành canh tác theo tiêu chuẩn bền vững.",
  },
  {
    id: "khach-hang",
    value: "12.000+",
    label: "Khách Hàng Tin Chọn",
    description: "Hộ gia đình, chuỗi nhà hàng cao cấp và siêu thị thực phẩm sạch trên toàn quốc.",
  },
];

export const historyMilestones: HistoryMilestone[] = [
  {
    year: "2018",
    title: "Gieo mầm hạt giống đầu tiên",
    description:
      "Khởi đầu từ mảnh vườn thực nghiệm 3 hecta tại Đạ Nhim, Lâm Đồng với khát vọng khôi phục nông nghiệp không hóa chất.",
  },
  {
    year: "2020",
    title: "Ứng dụng công nghệ vi sinh bản địa",
    description:
      "Hoàn thiện quy trình nhân sinh khối vi sinh bản địa IMO, cải tạo tầng đất sâu và đạt chứng nhận hữu cơ mở rộng.",
  },
  {
    year: "2022",
    title: "Mở rộng liên kết nông hộ đa vùng",
    description:
      "Hình thành chuỗi liên kết cùng hơn 50 hợp tác xã nông dân Tây Bắc và Mekong, đưa mô hình lúa tôm và vườn quả vào vận hành.",
  },
  {
    year: "2024",
    title: "Số hóa truy xuất nguồn gốc & Chuỗi lạnh",
    description:
      "Ứng dụng mã QR minh bạch từng luống rau, đồng thời hoàn thiện hệ thống xe lạnh chuyên dụng giao nhanh trong 24 giờ.",
  },
  {
    year: "2026",
    title: "Hệ sinh thái tuần hoàn kiểu mẫu",
    description:
      "Xây dựng trung tâm nghiên cứu giống bản địa, chuyển giao kỹ thuật canh tác tái sinh và vươn tầm nông sản Việt ra thế giới.",
  },
];

export const coreFeatures: CoreFeature[] = [
  {
    id: "f-1",
    title: "Cơ giới hóa & Nông nghiệp thông minh",
    description:
      "Ứng dụng máy móc hiện đại, hệ thống tưới nhỏ giọt bù áp và cảm biến IoT theo dõi thổ nhưỡng tự động.",
    iconName: "Tractor",
  },
  {
    id: "f-2",
    title: "Đội ngũ kỹ sư nông học giàu kinh nghiệm",
    description:
      "Đội ngũ chuyên gia tốt nghiệp Đại học Nông Lâm, tu nghiệp tại Nhật Bản trực tiếp hướng dẫn kỹ thuật tận đồng ruộng.",
    iconName: "UserCheck",
  },
  {
    id: "f-3",
    title: "100% Nông sản hữu cơ tươi lành",
    description:
      "Nói không với phân bón hóa học, thuốc trừ sâu độc hại và giống biến đổi gen. Thu hoạch đúng độ chín sinh lý.",
    iconName: "Leaf",
  },
  {
    id: "f-4",
    title: "Canh tác thuận tự nhiên thân thiện môi trường",
    description:
      "Bảo tồn đa dạng sinh học, nuôi dưỡng đất sống và giữ gìn nguồn nước ngầm cho thế hệ mai sau.",
    iconName: "Globe",
  },
];

export const pricingPlans = [
  {
    id: "goi-gia-dinh",
    name: "Hộp Rau Tuần Hoàn Gia Đình",
    price: "450.000đ",
    frequency: "/ tuần",
    description:
      "Phù hợp cho gia đình 3-4 người, cung cấp đủ rau ăn lá, củ quả tươi sạch cho 7 ngày dinh dưỡng lành mạnh.",
    features: [
      "Khoảng 6-7kg rau củ quả theo mùa phong phú",
      "Giao định kỳ 2 lần/tuần (thứ Ba và thứ Sáu)",
      "Được linh hoạt tùy chọn loại rau theo khẩu vị gia đình",
      "Miễn phí vận chuyển nội thành bán kính 10km",
      "Tặng kèm gia vị thảo mộc tự nhiên theo mùa vụ",
    ],
    highlighted: false,
    ctaText: "Đăng ký gói tuần",
  },
  {
    id: "goi-doanh-nghiep",
    name: "Cung Ứng Bếp Ăn & Nhà Hàng",
    price: "Báo giá theo tuần",
    frequency: "/ hợp đồng",
    description:
      "Giải pháp nguồn nguyên liệu nông sản chuẩn sạch ổn định, xuất hóa đơn VAT và kiểm định định kỳ cho đối tác ẩm thực.",
    features: [
      "Nguồn cung ổn định từ 50kg - 1.000kg/ngày",
      "Giao sớm từ 05:00 - 07:00 sáng bằng xe lạnh chuyên dụng",
      "Hồ sơ kiểm định vi sinh và dư lượng thuốc đầy đủ",
      "Chính sách công nợ linh hoạt 15 - 30 ngày cho đối tác",
      "Cam kết đổi trả 100% nếu chất lượng không đạt yêu cầu",
    ],
    highlighted: true,
    ctaText: "Yêu cầu báo giá B2B",
  },
  {
    id: "goi-chuyen-giao",
    name: "Tư Vấn & Chuyển Giao Canh Tác",
    price: "Theo quy mô dự án",
    frequency: "/ trọn gói",
    description:
      "Dành cho chủ trang trại, hợp tác xã muốn chuyển đổi sang canh tác hữu cơ theo tiêu chuẩn quốc tế và liên kết bao tiêu.",
    features: [
      "Khảo sát thổ nhưỡng và lập bản đồ nông học chi tiết",
      "Chuyển giao công nghệ nhân sinh khối vi sinh bản địa IMO",
      "Thiết kế hệ thống tưới tự động và quản trị dịch hại sinh học",
      "Hỗ trợ thủ tục thẩm định chứng nhận hữu cơ quốc tế",
      "Ký hợp đồng liên kết bao tiêu nông sản đầu ra dài hạn",
    ],
    highlighted: false,
    ctaText: "Liên hệ tư vấn chuyển giao",
  },
];

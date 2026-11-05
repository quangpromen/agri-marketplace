import { Service } from "@/types";

export const servicesData: Service[] = [
  {
    id: "canh-tac-huu-co",
    slug: "canh-tac-huu-co",
    title: "Canh tác hữu cơ chuẩn quốc tế",
    shortDescription:
      "Ứng dụng phương pháp tự nhiên, 100% không phân hóa học và thuốc trừ sâu tổng hợp.",
    description:
      "Mộc Farm triển khai mô hình canh tác hữu cơ khép kín theo tiêu chuẩn quốc tế và PGS Việt Nam. Chúng tôi nuôi dưỡng đất bằng vi sinh bản địa, tận dụng thiên địch và nguồn nước ngầm tự nhiên để cây trồng sinh trưởng khỏe mạnh, trọn vẹn hương vị thuần khiết.",
    iconName: "Sprout",
    features: [
      "Không hóa chất độc hại, không biến đổi gen (Non-GMO)",
      "Đất được cải tạo bằng mùn vi sinh hữu cơ đa tầng",
      "Hệ thống tưới tự động nhỏ giọt tiết kiệm tài nguyên nước",
      "Kiểm định vi sinh và dư lượng định kỳ 30 ngày/lần",
    ],
    imageUrl: "/images/services/service-1.jpg",
  },
  {
    id: "cung-cap-nong-san-sach",
    slug: "cung-cap-nong-san-sach",
    title: "Cung cấp nông sản tươi sạch",
    shortDescription:
      "Rau củ quả thu hoạch đúng độ chín sinh lý, vận chuyển lạnh đến tay người tiêu dùng trong 24h.",
    description:
      "Dịch vụ chuỗi cung ứng nông sản tươi từ vườn tới bàn ăn (Farm to Table). Mộc Farm cam kết thu hoạch vào sáng sớm, bảo quản lạnh ở nhiệt độ tiêu chuẩn và giao nhận trực tiếp tới các chuỗi cửa hàng thực phẩm, nhà hàng cao cấp và hộ gia đình.",
    iconName: "ShoppingBag",
    features: [
      "Thu hái tươi mới lúc sáng sớm mỗi ngày",
      "Quy trình đóng gói sơ chế đạt chuẩn an toàn vệ sinh thực phẩm",
      "Truy xuất nguồn gốc bằng mã QR minh bạch trên từng sản phẩm",
      "Chính sách đổi trả 100% nếu sản phẩm dập nát hoặc không tươi",
    ],
    imageUrl: "/images/services/service-2.jpg",
  },
  {
    id: "tu-van-ky-thuat-nong-nghiep",
    slug: "tu-van-ky-thuat-nong-nghiep",
    title: "Tư vấn kỹ thuật nông nghiệp",
    shortDescription:
      "Chuyển giao quy trình chuyển đổi hữu cơ và kỹ thuật quản lý dịch hại sinh học tự nhiên.",
    description:
      "Đội ngũ kỹ sư nông học giàu kinh nghiệm của Mộc Farm đồng hành cùng bà con nông dân và chủ trang trại trong quá trình chuyển đổi từ phương thức canh tác truyền thống sang nông nghiệp tuần hoàn sinh thái bền vững.",
    iconName: "BookOpen",
    features: [
      "Khảo sát hiện trạng và đánh giá tiềm năng thổ nhưỡng",
      "Lập phác đồ cải tạo đất và thiết kế hệ thống canh tác",
      "Đào tạo kỹ năng ủ phân compost và chế phẩm sinh học",
      "Giám sát chuyên môn định kỳ và hỗ trợ xin cấp chứng nhận",
    ],
    imageUrl: "/images/services/service-3.jpg",
  },
  {
    id: "quan-ly-nong-trai",
    slug: "quan-ly-nong-trai",
    title: "Quản lý và vận hành nông trại",
    shortDescription:
      "Giải pháp trọn gói từ quy hoạch, nhân sự đến ứng dụng công nghệ IoT giám sát đồng ruộng.",
    description:
      "Cung cấp gói dịch vụ ủy thác vận hành trang trại nông nghiệp sinh thái. Mộc Farm thay mặt chủ đầu tư tổ chức nhân sự, điều phối lịch thời vụ, ứng dụng cảm biến độ ẩm, nhiệt độ và quản lý chi phí vận hành minh bạch.",
    iconName: "ShieldCheck",
    features: [
      "Thiết kế quy hoạch tổng mặt bằng trang trại thông minh",
      "Số hóa nhật ký đồng ruộng và quản trị kho vật tư",
      "Báo cáo tiến độ và sức khỏe nông trại định kỳ hàng tuần",
      "Tối ưu hóa chi phí sản xuất và nâng cao năng suất mùa vụ",
    ],
    imageUrl: "/images/services/service-4.jpg",
  },
  {
    id: "kiem-tra-chat-luong-dat",
    slug: "kiem-tra-chat-luong-dat",
    title: "Kiểm tra chất lượng đất & nguồn nước",
    shortDescription:
      "Đo lường các chỉ số dinh dưỡng đất, độ pH và tầm soát kim loại nặng với độ chuẩn xác cao.",
    description:
      "Nền móng của một vụ mùa an lành bắt đầu từ đất sạch và nước sạch. Dịch vụ lấy mẫu tận vườn, phân tích chuyên sâu các thành phần khoáng chất vi lượng, đa lượng và phát hiện kịp thời các chất ô nhiễm tồn dư.",
    iconName: "FlaskConical",
    features: [
      "Đo chỉ số pH, EC và dung tích hấp thu cation (CEC)",
      "Định lượng hàm lượng mùn hữu cơ và vi sinh vật có lợi",
      "Tầm soát kim loại nặng (Chì, Asen, Cadmium, Thủy ngân)",
      "Đưa ra giải pháp cân bằng dưỡng chất tự nhiên không hóa chất",
    ],
    imageUrl: "/images/services/service-5.jpg",
  },
  {
    id: "thu-hoach-va-phan-phoi",
    slug: "thu-hoach-va-phan-phoi",
    title: "Thu hoạch và bao tiêu phân phối",
    shortDescription:
      "Liên kết chuỗi giá trị bền vững, bao tiêu đầu ra ổn định với mức giá công bằng cho nông hộ.",
    description:
      "Mộc Farm xây dựng liên minh nông nghiệp bền vững cùng các hợp tác xã nông dân. Chúng tôi đảm bảo đầu ra nông sản với hợp đồng cam kết giá thu mua ổn định, loại bỏ rủi ro 'được mùa mất giá' cho bà con.",
    iconName: "Truck",
    features: [
      "Hợp đồng bao tiêu nông sản dài hạn với giá cam kết",
      "Xe lạnh chuyên dụng tiếp nhận trực tiếp tại cửa ruộng",
      "Phân loại chất lượng nghiêm ngặt theo tiêu chuẩn thương mại",
      "Thanh toán nhanh gọn, minh bạch và hỗ trợ vốn vật tư đầu vụ",
    ],
    imageUrl: "/images/services/service-6.jpg",
  },
];

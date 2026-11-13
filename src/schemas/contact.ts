import { z } from "zod";

export const contactServiceValues = [
  "hop-rau-tuan",
  "cung-ung-bep-an",
  "chuyen-giao-ky-thuat",
  "tham-quan-nong-trai",
  "khac",
] as const;

export type ContactServiceValue = (typeof contactServiceValues)[number];

export const contactServiceLabels: Record<ContactServiceValue, string> = {
  "hop-rau-tuan": "Mua nông sản / Hộp rau gia đình",
  "cung-ung-bep-an": "Cung ứng cho nhà hàng / Siêu thị",
  "chuyen-giao-ky-thuat": "Tư vấn chuyển giao kỹ thuật canh tác",
  "tham-quan-nong-trai": "Đặt lịch tham quan trải nghiệm nông trại",
  khac: "Chủ đề khác",
};

export function getContactServiceLabel(service: string): string {
  return Object.prototype.hasOwnProperty.call(contactServiceLabels, service)
    ? contactServiceLabels[service as ContactServiceValue]
    : service;
}

const vietnamesePhonePattern = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;

export const contactSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ tên từ 2 ký tự.")
    .max(100, "Họ tên tối đa 100 ký tự."),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s().-]/g, ""))
    .refine((value) => vietnamesePhonePattern.test(value), "Số điện thoại Việt Nam không hợp lệ."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vui lòng nhập địa chỉ email hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  service: z.enum(contactServiceValues, "Chủ đề bạn chọn không hợp lệ."),
  message: z
    .string()
    .trim()
    .min(10, "Nội dung cần có ít nhất 10 ký tự.")
    .max(2000, "Nội dung tối đa 2.000 ký tự."),
  website: z.string().max(0, "Yêu cầu không hợp lệ."),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

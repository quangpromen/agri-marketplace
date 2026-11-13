import type {
  ContactSubmissionStatus,
  EmailDeliveryStatus,
} from "@/schemas/admin-contact";
import {
  CONTACT_SUBMISSION_STATUSES,
  EMAIL_DELIVERY_STATUSES,
} from "@/schemas/admin-contact";

export type BadgeIconKey =
  | "sparkles"
  | "phone-call"
  | "check-circle"
  | "ban"
  | "clock"
  | "mail-check"
  | "alert-triangle";

export type StatusPresentationMeta = {
  label: string;
  description: string;
  badgeClassName: string;
  icon: BadgeIconKey;
};

export const CONTACT_STATUS_META: Record<
  ContactSubmissionStatus,
  StatusPresentationMeta
> = {
  new: {
    label: "Mới",
    description: "Yêu cầu mới tiếp nhận, chưa liên hệ khách hàng.",
    badgeClassName: "border-sky-300 bg-sky-50 text-sky-900",
    icon: "sparkles",
  },
  contacted: {
    label: "Đã liên hệ",
    description: "Quản trị viên đã trao đổi với khách hàng, đang theo dõi.",
    badgeClassName: "border-amber-300 bg-amber-50 text-amber-900",
    icon: "phone-call",
  },
  resolved: {
    label: "Đã xử lý",
    description: "Yêu cầu tư vấn đã hoàn tất hỗ trợ.",
    badgeClassName: "border-primary/30 bg-primary/10 text-primary-dark",
    icon: "check-circle",
  },
  spam: {
    label: "Spam",
    description: "Yêu cầu rác hoặc không hợp lệ.",
    badgeClassName: "border-stone-300 bg-stone-100 text-stone-800",
    icon: "ban",
  },
};

export const EMAIL_STATUS_META: Record<
  EmailDeliveryStatus,
  StatusPresentationMeta
> = {
  pending: {
    label: "Đang chờ",
    description: "Email thông báo đang chờ xử lý.",
    badgeClassName: "border-amber-300 bg-amber-50 text-amber-900",
    icon: "clock",
  },
  sent: {
    label: "Đã gửi",
    description: "Email thông báo đã gửi thành công.",
    badgeClassName: "border-emerald-300 bg-emerald-50 text-emerald-900",
    icon: "mail-check",
  },
  failed: {
    label: "Gửi thất bại",
    description: "Email thông báo gửi thất bại.",
    badgeClassName: "border-red-300 bg-red-50 text-red-900 font-bold",
    icon: "alert-triangle",
  },
};

export const CONTACT_STATUS_OPTIONS = CONTACT_SUBMISSION_STATUSES.map((value) => ({
  value,
  label: CONTACT_STATUS_META[value].label,
}));

export const EMAIL_STATUS_OPTIONS = EMAIL_DELIVERY_STATUSES.map((value) => ({
  value,
  label: EMAIL_STATUS_META[value].label,
}));

const adminDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatAdminDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return adminDateTimeFormatter.format(date);
}


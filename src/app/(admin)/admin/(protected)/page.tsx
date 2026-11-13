import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Eye,
  Inbox,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { AdminRequestTrendChart } from "@/components/admin/admin-request-trend-chart";
import { AdminStatusDistribution } from "@/components/admin/admin-status-distribution";
import {
  ContactStatusBadge,
  EmailStatusBadge,
} from "@/components/admin/contact-status-badges";
import { getButtonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatAdminDateTime } from "@/lib/admin-contact-presentation";
import { constructMetadata } from "@/lib/metadata";
import { cn, formatNumber } from "@/lib/utils";
import {
  buildAdminContactDetailHref,
  buildAdminContactsHref,
} from "@/schemas/admin-contact";
import { getContactServiceLabel } from "@/schemas/contact";
import { getAdminDashboardData } from "@/server/admin/dashboard";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Tổng quan vận hành",
  description:
    "Tổng quan hoạt động tiếp nhận và xử lý yêu cầu tư vấn nội bộ Mộc Farm.",
  noIndex: true,
});

type DashboardMetricCardConfig = {
  key: string;
  label: string;
  count: number;
  note: string;
  href: string;
  icon: LucideIcon;
  iconWrapperClassName: string;
  spanClassName?: string;
  isWarning?: boolean;
  warningBadgeLabel?: string;
};

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();
  const dashboard = await getAdminDashboardData();

  const hasFailedEmails = dashboard.failedEmailCount > 0;

  const metricCards: DashboardMetricCardConfig[] = [
    {
      key: "total",
      label: "Tổng yêu cầu",
      count: dashboard.totalCount,
      note: "Toàn bộ hệ thống",
      href: buildAdminContactsHref(),
      icon: Inbox,
      iconWrapperClassName: "bg-primary/10 text-primary",
      spanClassName: "sm:col-span-2 lg:col-span-1",
    },
    {
      key: "new",
      label: "Yêu cầu mới",
      count: dashboard.newCount,
      note: "Chờ liên hệ đầu tiên",
      href: buildAdminContactsHref({ status: "new" }),
      icon: Sparkles,
      iconWrapperClassName: "bg-secondary/25 text-primary-dark",
    },
    {
      key: "open",
      label: "Chưa xử lý",
      count: dashboard.openCount,
      note: "Mới & đang trao đổi",
      href: buildAdminContactsHref({ status: "open" }),
      icon: Clock,
      iconWrapperClassName: "bg-accent/20 text-accent-dark",
    },
    {
      key: "failed-email",
      label: "Email gửi thất bại",
      count: dashboard.failedEmailCount,
      note: hasFailedEmails ? "Cần liên hệ trực tiếp" : "Không có lỗi gửi",
      href: buildAdminContactsHref({ emailStatus: "failed" }),
      icon: AlertTriangle,
      iconWrapperClassName: hasFailedEmails
        ? "bg-red-100 text-red-900"
        : "bg-stone-100 text-stone-600",
      isWarning: hasFailedEmails,
      warningBadgeLabel: hasFailedEmails ? "Cần kiểm tra" : undefined,
    },
    {
      key: "last-7-days",
      label: "7 ngày gần nhất",
      count: dashboard.lastSevenDaysCount,
      note: "Cửa sổ 7 ngày qua",
      href: buildAdminContactsHref({ period: "7d" }),
      icon: CalendarDays,
      iconWrapperClassName: "bg-primary/10 text-primary",
    },
  ];

  return (
    <Container className="space-y-6 sm:space-y-7">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tổng quan vận hành
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Tổng hợp khối lượng tiếp nhận, xu hướng 14 ngày và tiến độ xử lý yêu
            cầu tư vấn trên hệ thống Mộc Farm.
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
            <span>
              Quản trị viên:{" "}
              <span className="font-semibold text-foreground">{user.name}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Cập nhật theo dữ liệu hiện tại</span>
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href={buildAdminContactsHref()}
            className={getButtonClassName({
              variant: "default",
              size: "default",
              className: "w-full gap-2 sm:w-auto",
            })}
          >
            <span>Quản lý yêu cầu tư vấn</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section aria-labelledby="dashboard-metrics-heading">
        <h2 id="dashboard-metrics-heading" className="sr-only">
          Thống kê yêu cầu tư vấn
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.key}
                href={card.href}
                className={cn(
                  "focus-ring group block h-full rounded-xl",
                  card.spanClassName
                )}
              >
                <div
                  className={cn(
                    "flex h-full flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors",
                    card.isWarning
                      ? "border-red-300 bg-red-50/75 hover:border-red-400 hover:bg-red-50"
                      : "border-border hover:border-primary/40 hover:bg-cream/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          card.isWarning ? "text-red-950" : "text-muted-foreground"
                        )}
                      >
                        {card.label}
                      </p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p
                          className={cn(
                            "text-2xl font-bold tracking-tight tabular-nums sm:text-3xl",
                            card.isWarning ? "text-red-900" : "text-foreground"
                          )}
                        >
                          {formatNumber(card.count)}
                        </p>
                        {card.warningBadgeLabel ? (
                          <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-900">
                            {card.warningBadgeLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        card.iconWrapperClassName
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs",
                      card.isWarning
                        ? "border-red-200/80 text-red-900/90"
                        : "border-border/60 text-muted-foreground"
                    )}
                  >
                    <span className="truncate">{card.note}</span>
                    <ArrowUpRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                        card.isWarning
                          ? "text-red-900"
                          : "text-muted-foreground group-hover:text-primary"
                      )}
                      aria-hidden="true"
                    />
                    <span className="sr-only"> — Mở danh sách lọc</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <AdminRequestTrendChart trend={dashboard.trend} />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <AdminStatusDistribution distribution={dashboard.statusDistribution} />
        </div>
      </div>

      <section aria-labelledby="recent-submissions-heading" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2
              id="recent-submissions-heading"
              className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
            >
              Yêu cầu mới nhất
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Năm yêu cầu tư vấn được gửi gần đây nhất từ website.
            </p>
          </div>

          <Link
            href={buildAdminContactsHref()}
            className={getButtonClassName({
              variant: "outline",
              size: "sm",
              className: "min-h-[44px] gap-1.5 px-4",
            })}
          >
            <span>Xem tất cả yêu cầu</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {dashboard.recentSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-primary">
              <Inbox className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Chưa có yêu cầu tư vấn nào
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Khi khách hàng gửi thông tin từ biểu mẫu liên hệ trên website, các
              yêu cầu mới nhất sẽ hiển thị tại đây.
            </p>
            <div className="mt-4">
              <Link
                href={buildAdminContactsHref()}
                className={getButtonClassName({
                  variant: "outline",
                  size: "sm",
                  className: "min-h-[44px] gap-1.5 px-4",
                })}
              >
                <span>Đi tới danh sách yêu cầu</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div
              aria-hidden="true"
              className="hidden border-b border-border/80 bg-cream/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_210px_136px_132px] lg:items-center lg:gap-4"
            >
              <span>Khách hàng</span>
              <span>Dịch vụ quan tâm</span>
              <span>Trạng thái</span>
              <span>Thời gian gửi</span>
              <span className="text-right">Thao tác</span>
            </div>

            <ul className="divide-y divide-border/80">
              {dashboard.recentSubmissions.map((item) => {
                const isEmailFailed = item.emailStatus === "failed";
                const detailHref = buildAdminContactDetailHref(item.id);

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-cream/30 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_210px_136px_132px] lg:items-center lg:gap-4",
                      isEmailFailed && "border-l-4 border-l-red-500 bg-red-50/40"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="min-w-0 break-words font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums lg:hidden">
                        {formatAdminDateTime(item.createdAt)}
                      </p>
                    </div>

                    <p className="min-w-0 break-words text-sm text-muted-foreground">
                      {getContactServiceLabel(item.service)}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <ContactStatusBadge status={item.status} />
                      <EmailStatusBadge status={item.emailStatus} />
                    </div>

                    <p className="hidden whitespace-nowrap text-xs text-muted-foreground tabular-nums lg:block">
                      {formatAdminDateTime(item.createdAt)}
                    </p>

                    <div className="flex items-center justify-end">
                      <Link
                        href={detailHref}
                        className={getButtonClassName({
                          variant: "outline",
                          size: "sm",
                          className: "min-h-[44px] w-full gap-1.5 sm:w-auto",
                        })}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          Xem chi tiết
                          <span className="sr-only"> yêu cầu của {item.name}</span>
                        </span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </Container>
  );
}

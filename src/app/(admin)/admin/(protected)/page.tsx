import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  Eye,
  Inbox,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import {
  ContactStatusBadge,
  EmailStatusBadge,
} from "@/components/admin/contact-status-badges";
import { getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  title: "Trang quản trị Mộc Farm",
  description: "Tổng quan hoạt động tiếp nhận và xử lý yêu cầu tư vấn nội bộ Mộc Farm.",
  noIndex: true,
});

type DashboardMetricCardConfig = {
  key: string;
  label: string;
  count: number;
  description: string;
  href: string;
  icon: LucideIcon;
  iconWrapperClassName: string;
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
      description: "Toàn bộ yêu cầu tư vấn đã tiếp nhận trên hệ thống.",
      href: buildAdminContactsHref(),
      icon: Inbox,
      iconWrapperClassName: "bg-primary/10 text-primary",
    },
    {
      key: "new",
      label: "Yêu cầu mới",
      count: dashboard.newCount,
      description: "Yêu cầu vừa tiếp nhận, chưa liên hệ khách hàng.",
      href: buildAdminContactsHref({ status: "new" }),
      icon: Sparkles,
      iconWrapperClassName: "bg-sky-100 text-sky-900",
    },
    {
      key: "open",
      label: "Chưa xử lý",
      count: dashboard.openCount,
      description: "Gồm yêu cầu mới và đang trao đổi với khách hàng.",
      href: buildAdminContactsHref({ status: "open" }),
      icon: Clock,
      iconWrapperClassName: "bg-amber-100 text-amber-900",
    },
    {
      key: "failed-email",
      label: "Email gửi thất bại",
      count: dashboard.failedEmailCount,
      description: hasFailedEmails
        ? "Cần kiểm tra và chủ động liên hệ trực tiếp khách hàng."
        : "Chưa ghi nhận yêu cầu nào lỗi gửi email thông báo.",
      href: buildAdminContactsHref({ emailStatus: "failed" }),
      icon: AlertTriangle,
      iconWrapperClassName: hasFailedEmails
        ? "bg-red-100 text-red-900"
        : "bg-muted text-muted-foreground",
      isWarning: hasFailedEmails,
      warningBadgeLabel: hasFailedEmails ? "Cần kiểm tra" : undefined,
    },
    {
      key: "last-7-days",
      label: "7 ngày gần nhất",
      count: dashboard.lastSevenDaysCount,
      description: "Yêu cầu được gửi trong 7 ngày gần đây.",
      href: buildAdminContactsHref({ period: "7d" }),
      icon: CalendarDays,
      iconWrapperClassName: "bg-secondary/25 text-primary-dark",
    },
  ];

  return (
    <Container className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Trang quản trị Mộc Farm
        </h1>
        <p className="text-sm text-muted-foreground">
          Xin chào <span className="font-semibold text-foreground">{user.name}</span> ({user.email}
          ). Phiên làm việc quản trị của bạn đã được xác minh an toàn.
        </p>
      </div>

      <section aria-labelledby="dashboard-metrics-heading" className="space-y-4">
        <h2 id="dashboard-metrics-heading" className="sr-only">
          Thống kê yêu cầu tư vấn
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.key}
                href={card.href}
                className="focus-ring group block h-full rounded-xl"
              >
                <Card
                  className={cn(
                    "flex h-full flex-col transition-colors",
                    card.isWarning
                      ? "border-red-300 bg-red-50/70 hover:border-red-400 hover:bg-red-50"
                      : "hover:border-primary/40 hover:bg-cream/25"
                  )}
                >
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          card.iconWrapperClassName
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>

                      {card.warningBadgeLabel ? (
                        <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900">
                          {card.warningBadgeLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          card.isWarning ? "text-red-950" : "text-foreground"
                        )}
                      >
                        {card.label}
                      </p>
                      <p
                        className={cn(
                          "text-3xl font-bold tracking-tight",
                          card.isWarning ? "text-red-900" : "text-foreground"
                        )}
                      >
                        {formatNumber(card.count)}
                      </p>
                    </div>

                    <p
                      className={cn(
                        "mt-2 text-xs leading-relaxed",
                        card.isWarning ? "text-red-900/90" : "text-muted-foreground"
                      )}
                    >
                      {card.description}
                    </p>

                    <div
                      className={cn(
                        "mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold",
                        card.isWarning ? "text-red-900" : "text-primary"
                      )}
                    >
                      <span>Xem danh sách</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="recent-submissions-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2
              id="recent-submissions-heading"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              Yêu cầu mới nhất
            </h2>
            <p className="text-sm text-muted-foreground">
              Năm yêu cầu tư vấn được gửi gần đây nhất từ website.
            </p>
          </div>

          <Link
            href={buildAdminContactsHref()}
            className={getButtonClassName({
              variant: "outline",
              size: "sm",
              className: "gap-1.5",
            })}
          >
            <span>Xem tất cả yêu cầu</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {dashboard.recentSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
                <Inbox className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Chưa có yêu cầu tư vấn nào
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Khi khách hàng gửi thông tin từ biểu mẫu liên hệ trên website, các yêu cầu mới nhất
                sẽ hiển thị tại đây.
              </p>
              <div className="mt-5">
                <Link
                  href={buildAdminContactsHref()}
                  className={getButtonClassName({
                    variant: "outline",
                    size: "sm",
                    className: "gap-1.5",
                  })}
                >
                  <span>Đi tới danh sách yêu cầu</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/80">
                {dashboard.recentSubmissions.map((item) => {
                  const isEmailFailed = item.emailStatus === "failed";
                  const detailHref = buildAdminContactDetailHref(item.id);

                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-col gap-3 p-4 transition-colors hover:bg-cream/30 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4",
                        isEmailFailed && "bg-red-50/40"
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="min-w-0 break-words font-semibold text-foreground">
                            {item.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatAdminDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="min-w-0 break-words text-sm text-muted-foreground">
                          {getContactServiceLabel(item.service)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                        <ContactStatusBadge status={item.status} />
                        <EmailStatusBadge status={item.emailStatus} />
                        <Link
                          href={detailHref}
                          className={getButtonClassName({
                            variant: "outline",
                            size: "sm",
                            className: "ml-auto gap-1.5 lg:ml-2",
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
            </CardContent>
          </Card>
        )}
      </section>
    </Container>
  );
}

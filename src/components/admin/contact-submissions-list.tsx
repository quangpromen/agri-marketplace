import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Mail,
  Phone,
  RotateCcw,
  SearchX,
} from "lucide-react";
import {
  ContactStatusBadge,
  EmailStatusBadge,
} from "@/components/admin/contact-status-badges";
import { getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAdminDateTime } from "@/lib/admin-contact-presentation";
import { cn, formatNumber } from "@/lib/utils";
import {
  ADMIN_CONTACTS_PATH,
  type AdminContactFilters,
  buildAdminContactDetailHref,
  buildAdminContactsHref,
  hasActiveAdminContactFilters,
} from "@/schemas/admin-contact";
import { getContactServiceLabel } from "@/schemas/contact";
import type { ContactSubmissionListResult } from "@/server/admin/contact-submissions";

interface ContactSubmissionsListProps {
  result: ContactSubmissionListResult;
  filters: AdminContactFilters;
}

export function ContactSubmissionsList({
  result,
  filters,
}: ContactSubmissionsListProps) {
  const hasFilters = hasActiveAdminContactFilters(filters);

  if (result.totalCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
            {hasFilters ? (
              <SearchX className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Inbox className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {hasFilters
              ? "Không tìm thấy yêu cầu phù hợp"
              : "Chưa có yêu cầu tư vấn nào"}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "Không có yêu cầu nào khớp với từ khoá tìm kiếm hoặc bộ lọc hiện tại. Hãy thử điều chỉnh lại điều kiện."
              : "Khi khách hàng gửi thông tin từ trang liên hệ trên website, các yêu cầu sẽ hiển thị tại đây."}
          </p>
          {hasFilters ? (
            <div className="mt-5">
              <Link
                href={ADMIN_CONTACTS_PATH}
                className={getButtonClassName({
                  variant: "outline",
                  size: "sm",
                  className: "gap-2",
                })}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Xoá bộ lọc</span>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const startItem = (result.page - 1) * result.pageSize + 1;
  const endItem = Math.min(result.page * result.pageSize, result.totalCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Tổng cộng{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(result.totalCount)}
          </span>{" "}
          yêu cầu tư vấn (đang hiển thị{" "}
          <span className="font-semibold text-foreground">
            {startItem}–{endItem}
          </span>
          )
        </p>
        <p>
          Trang{" "}
          <span className="font-semibold text-foreground">{result.page}</span> /{" "}
          {result.totalPages}
        </p>
      </div>

      {/* Bảng hiển thị trên tablet và desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3.5">
                Khách hàng
              </th>
              <th scope="col" className="px-4 py-3.5">
                Số điện thoại
              </th>
              <th scope="col" className="px-4 py-3.5">
                Email
              </th>
              <th scope="col" className="px-4 py-3.5">
                Dịch vụ quan tâm
              </th>
              <th scope="col" className="px-4 py-3.5">
                Trạng thái
              </th>
              <th scope="col" className="px-4 py-3.5">
                Gửi email
              </th>
              <th scope="col" className="px-4 py-3.5">
                Thời gian gửi
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {result.items.map((item) => {
              const isEmailFailed = item.emailStatus === "failed";
              const detailHref = buildAdminContactDetailHref(item.id, filters);

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "transition-colors hover:bg-cream/30",
                    isEmailFailed && "bg-red-50/40"
                  )}
                >
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    {item.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-foreground/90">
                    {item.phone}
                  </td>
                  <td className="max-w-[220px] break-all px-4 py-3.5 text-foreground/90">
                    {item.email}
                  </td>
                  <td className="max-w-[220px] px-4 py-3.5 text-muted-foreground">
                    {getContactServiceLabel(item.service)}
                  </td>
                  <td className="px-4 py-3.5">
                    <ContactStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <EmailStatusBadge status={item.emailStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                    {formatAdminDateTime(item.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <Link
                      href={detailHref}
                      className={getButtonClassName({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1.5",
                      })}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        Xem chi tiết
                        <span className="sr-only"> yêu cầu của {item.name}</span>
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bố cục thẻ trên màn hình nhỏ */}
      <div className="space-y-3 md:hidden">
        {result.items.map((item) => {
          const isEmailFailed = item.emailStatus === "failed";
          const detailHref = buildAdminContactDetailHref(item.id, filters);

          return (
            <Card
              key={item.id}
              className={cn(isEmailFailed && "border-red-300 bg-red-50/30")}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {item.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ContactStatusBadge status={item.status} />
                    <EmailStatusBadge status={item.emailStatus} />
                  </div>
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-foreground/90">
                    <dt className="sr-only">Số điện thoại</dt>
                    <Phone
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <dd>{item.phone}</dd>
                  </div>
                  <div className="flex items-center gap-2 break-all text-foreground/90">
                    <dt className="sr-only">Email</dt>
                    <Mail
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <dd>{item.email}</dd>
                  </div>
                  <div className="pt-1 text-xs text-muted-foreground">
                    <dt className="inline font-semibold text-foreground/80">
                      Dịch vụ:{" "}
                    </dt>
                    <dd className="inline">
                      {getContactServiceLabel(item.service)}
                    </dd>
                  </div>
                </dl>

                <div className="pt-1">
                  <Link
                    href={detailHref}
                    className={getButtonClassName({
                      variant: "outline",
                      size: "sm",
                      className: "w-full gap-1.5",
                    })}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Xem chi tiết
                      <span className="sr-only"> yêu cầu của {item.name}</span>
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Phân trang phía server */}
      <nav
        aria-label="Phân trang danh sách yêu cầu tư vấn"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      >
        <p className="text-xs text-muted-foreground sm:text-sm">
          Trang <span className="font-semibold text-foreground">{result.page}</span>{" "}
          trên{" "}
          <span className="font-semibold text-foreground">
            {result.totalPages}
          </span>
        </p>

        <div className="flex items-center gap-2">
          {result.page > 1 ? (
            <Link
              href={buildAdminContactsHref({
                ...filters,
                page: result.page - 1,
              })}
              className={getButtonClassName({
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
              })}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Trang trước</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={getButtonClassName({
                variant: "outline",
                size: "sm",
                className: "pointer-events-none gap-1.5 opacity-45",
              })}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Trang trước</span>
            </span>
          )}

          {result.page < result.totalPages ? (
            <Link
              href={buildAdminContactsHref({
                ...filters,
                page: result.page + 1,
              })}
              className={getButtonClassName({
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
              })}
            >
              <span>Trang sau</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={getButtonClassName({
                variant: "outline",
                size: "sm",
                className: "pointer-events-none gap-1.5 opacity-45",
              })}
            >
              <span>Trang sau</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}


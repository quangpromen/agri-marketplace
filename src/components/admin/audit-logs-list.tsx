import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  RotateCcw,
  SearchX,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CONTACT_STATUS_META,
  formatAdminDateTime,
} from "@/lib/admin-contact-presentation";
import { cn, formatNumber } from "@/lib/utils";
import {
  ADMIN_AUDIT_ACTION_META,
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_AUDIT_RESULT_META,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPE_META,
  ADMIN_AUDIT_TARGET_TYPES,
  type AdminAuditFilters,
  type AdminAuditResult,
  buildAdminAuditLogsHref,
  hasActiveAdminAuditFilters,
  truncateAuditTargetId,
} from "@/schemas/admin-audit";
import {
  buildAdminContactDetailHref,
  contactSubmissionIdSchema,
} from "@/schemas/admin-contact";
import type {
  AdminAuditLogListItem,
  AdminAuditLogListResult,
} from "@/server/admin/audit-logs";

interface AuditLogsListProps {
  result: AdminAuditLogListResult;
  filters: AdminAuditFilters;
}

function AuditResultBadge({
  result,
  className,
}: {
  result: AdminAuditResult;
  className?: string;
}) {
  const meta = ADMIN_AUDIT_RESULT_META[result];
  const Icon =
    result === ADMIN_AUDIT_RESULTS.SUCCESS ? CheckCircle2 : AlertTriangle;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap", meta.badgeClassName, className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </Badge>
  );
}

function AuditActorSummary({ item }: { item: AdminAuditLogListItem }) {
  const isFailedLogin = item.action === ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED;

  if (isFailedLogin) {
    return (
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 font-semibold text-red-950">
          <ShieldAlert
            className="h-3.5 w-3.5 shrink-0 text-red-700"
            aria-hidden="true"
          />
          <span>Chưa xác thực</span>
        </div>
        {item.actorEmailSnapshot ? (
          <p className="break-all text-xs text-muted-foreground">
            Email thử đăng nhập: {item.actorEmailSnapshot}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Không có email hợp lệ
          </p>
        )}
      </div>
    );
  }

  const displayName = item.actorNameSnapshot ?? "Quản trị viên";

  return (
    <div className="min-w-0 space-y-0.5">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <UserCheck
          className="h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="break-words">{displayName}</span>
      </div>
      {item.actorEmailSnapshot ? (
        <p className="break-all text-xs text-muted-foreground">
          {item.actorEmailSnapshot}
        </p>
      ) : null}
    </div>
  );
}

function AuditTargetSummary({ item }: { item: AdminAuditLogListItem }) {
  const targetTypeLabel = item.targetType
    ? ADMIN_AUDIT_TARGET_TYPE_META[item.targetType].label
    : "Hệ thống";
  const truncatedId = truncateAuditTargetId(item.targetId);

  const isContactTarget =
    item.targetType === ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION &&
    item.targetId !== null &&
    contactSubmissionIdSchema.safeParse(item.targetId).success;

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm font-medium text-foreground">{targetTypeLabel}</p>
      {truncatedId ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span
            title={truncatedId.full}
            aria-label={`Mã đối tượng ${truncatedId.full}`}
            className="inline-flex items-center rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90"
          >
            <span aria-hidden="true">{truncatedId.short}</span>
            <span className="sr-only">Mã đầy đủ: {truncatedId.full}</span>
          </span>
          {isContactTarget && item.targetId ? (
            <Link
              href={buildAdminContactDetailHref(item.targetId)}
              className="focus-ring inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold text-primary hover:underline"
            >
              <span>Mở yêu cầu</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}

function AuditDetailSummaryView({ item }: { item: AdminAuditLogListItem }) {
  const summary = item.detailSummary;

  switch (summary.kind) {
    case "contact_status_transition": {
      const fromMeta = CONTACT_STATUS_META[summary.from];
      const toMeta = CONTACT_STATUS_META[summary.to];

      return (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Chuyển trạng thái xử lý:
          </p>
          <p className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-border/80 bg-cream/50 px-2.5 py-1 text-xs font-semibold text-foreground">
            <span>{`${fromMeta.label} → ${toMeta.label}`}</span>
          </p>
        </div>
      );
    }

    case "notifications_mark_all_seen": {
      return (
        <div className="space-y-0.5 text-xs text-foreground/90">
          <p className="font-medium text-foreground">
            Đồng bộ trạng thái đã xem thông báo
          </p>
          {summary.receiptsCreated !== null ? (
            <p className="text-muted-foreground">
              Biên nhận đã xem mới tạo:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(summary.receiptsCreated)}
              </span>
            </p>
          ) : null}
        </div>
      );
    }

    case "auth_login_succeeded":
      return (
        <p className="text-xs text-muted-foreground">
          Khởi tạo phiên làm việc quản trị viên hợp lệ.
        </p>
      );

    case "auth_login_failed":
      return (
        <p className="text-xs text-red-900">
          {summary.reason === "auth_service_error"
            ? "Không thể hoàn tất xác thực do lỗi dịch vụ tạm thời."
            : "Từ chối đăng nhập do thông tin xác thực không hợp lệ."}
        </p>
      );

    case "auth_logout_succeeded":
      return (
        <p className="text-xs text-muted-foreground">
          Đã thu hồi phiên làm việc quản trị viên.
        </p>
      );

    case "generic":
      return (
        <p className="text-xs text-muted-foreground">
          {ADMIN_AUDIT_ACTION_META[item.action].description}
        </p>
      );
  }
}

export function AuditLogsList({ result, filters }: AuditLogsListProps) {
  const hasFilters = hasActiveAdminAuditFilters(filters);
  const hasCursor = Boolean(filters.cursor);
  const firstPageHref = buildAdminAuditLogsHref({
    action: filters.action,
    result: filters.result,
    period: filters.period,
  });

  if (result.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
            {hasFilters || hasCursor ? (
              <SearchX className="h-6 w-6" aria-hidden="true" />
            ) : (
              <ClipboardList className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {hasFilters
              ? "Không tìm thấy bản ghi nhật ký phù hợp"
              : "Chưa có bản ghi nhật ký hoạt động nào"}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "Không có sự kiện quản trị nào khớp với bộ lọc hiện tại. Hãy thử điều chỉnh lại điều kiện lọc."
              : "Các thao tác quan trọng của quản trị viên như đăng nhập, đăng xuất, đổi trạng thái tư vấn và đánh dấu thông báo sẽ được ghi nhận tại đây."}
          </p>
          {hasFilters || hasCursor ? (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {hasCursor ? (
                <Link
                  href={firstPageHref}
                  className={getButtonClassName({
                    variant: "default",
                    size: "sm",
                    className: "gap-2",
                  })}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Về trang đầu</span>
                </Link>
              ) : null}
              {hasFilters ? (
                <Link
                  href={ADMIN_AUDIT_LOGS_PATH}
                  className={getButtonClassName({
                    variant: "outline",
                    size: "sm",
                    className: "gap-2",
                  })}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Xoá bộ lọc</span>
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const prevHref = result.previousCursor
    ? buildAdminAuditLogsHref({
        action: filters.action,
        result: filters.result,
        period: filters.period,
        cursor: result.previousCursor,
      })
    : !result.isFirstPage
      ? firstPageHref
      : null;

  const nextHref = result.nextCursor
    ? buildAdminAuditLogsHref({
        action: filters.action,
        result: filters.result,
        period: filters.period,
        cursor: result.nextCursor,
      })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Đang hiển thị{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatNumber(result.items.length)}
          </span>{" "}
          sự kiện trên trang này (tối đa{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {result.pageSize}
          </span>{" "}
          bản ghi/trang)
        </p>
        <p className="text-xs text-muted-foreground">
          Sắp xếp: Mới nhất trước · Múi giờ Việt Nam (GMT+7)
        </p>
      </div>

      {/* Bảng hiển thị trên tablet và desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3.5">
                Thời gian
              </th>
              <th scope="col" className="px-4 py-3.5">
                Thao tác
              </th>
              <th scope="col" className="px-4 py-3.5">
                Kết quả
              </th>
              <th scope="col" className="px-4 py-3.5">
                Người thực hiện
              </th>
              <th scope="col" className="px-4 py-3.5">
                Đối tượng tác động
              </th>
              <th scope="col" className="px-4 py-3.5">
                Chi tiết thay đổi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {result.items.map((item) => {
              const actionMeta = ADMIN_AUDIT_ACTION_META[item.action];
              const isFailure = item.result === ADMIN_AUDIT_RESULTS.FAILURE;

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "align-top transition-colors hover:bg-cream/30",
                    isFailure && "bg-red-50/35"
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                    {formatAdminDateTime(item.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "whitespace-nowrap",
                          actionMeta.badgeClassName
                        )}
                      >
                        {actionMeta.label}
                      </Badge>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.action}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AuditResultBadge result={item.result} />
                  </td>
                  <td className="max-w-[230px] px-4 py-3.5">
                    <AuditActorSummary item={item} />
                  </td>
                  <td className="max-w-[210px] px-4 py-3.5">
                    <AuditTargetSummary item={item} />
                  </td>
                  <td className="max-w-[280px] px-4 py-3.5">
                    <AuditDetailSummaryView item={item} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bố cục thẻ trên màn hình nhỏ (375px+) */}
      <div className="space-y-3 md:hidden">
        {result.items.map((item) => {
          const actionMeta = ADMIN_AUDIT_ACTION_META[item.action];
          const isFailure = item.result === ADMIN_AUDIT_RESULTS.FAILURE;

          return (
            <Card
              key={item.id}
              className={cn(isFailure && "border-red-300 bg-red-50/30")}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-normal text-left",
                        actionMeta.badgeClassName
                      )}
                    >
                      {actionMeta.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatAdminDateTime(item.createdAt)}
                    </p>
                  </div>
                  <AuditResultBadge result={item.result} />
                </div>

                <dl className="space-y-2.5 border-t border-border/70 pt-2.5 text-sm">
                  <div className="space-y-0.5">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Người thực hiện
                    </dt>
                    <dd className="min-w-0">
                      <AuditActorSummary item={item} />
                    </dd>
                  </div>

                  <div className="space-y-0.5">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Đối tượng tác động
                    </dt>
                    <dd className="min-w-0">
                      <AuditTargetSummary item={item} />
                    </dd>
                  </div>

                  <div className="space-y-0.5">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Chi tiết
                    </dt>
                    <dd className="min-w-0">
                      <AuditDetailSummaryView item={item} />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Điều hướng phân trang theo con trỏ (keyset pagination) */}
      <nav
        aria-label="Phân trang nhật ký hoạt động"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>
            {result.isFirstPage
              ? "Đang ở trang mới nhất"
              : "Đang xem các bản ghi theo con trỏ thời gian"}
          </span>
          {!result.isFirstPage ? (
            <Link
              href={firstPageHref}
              className="focus-ring rounded px-1.5 py-0.5 font-semibold text-primary hover:underline"
            >
              Về trang đầu
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {prevHref ? (
            <Link
              href={prevHref}
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

          {nextHref ? (
            <Link
              href={nextHref}
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

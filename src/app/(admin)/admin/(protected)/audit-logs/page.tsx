import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { AuditLogsList } from "@/components/admin/audit-logs-list";
import { getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { constructMetadata } from "@/lib/metadata";
import {
  ADMIN_AUDIT_LOGS_PATH,
  parseAdminAuditSearchParams,
} from "@/schemas/admin-audit";
import type { RawSearchParams } from "@/schemas/admin-contact";
import {
  type AdminAuditLogListResult,
  listAdminAuditLogs,
} from "@/server/admin/audit-logs";
import { requireAdmin } from "@/server/auth/require-admin";
import { captureOperationalError } from "@/server/observability/capture-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Nhật ký hoạt động quản trị",
  description:
    "Theo dõi lịch sử các thao tác quản trị và sự kiện bảo mật nội bộ Mộc Farm.",
  noIndex: true,
});

interface AdminAuditLogsPageProps {
  searchParams?: RawSearchParams;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: AdminAuditLogsPageProps) {
  await requireAdmin();

  const filters = parseAdminAuditSearchParams(searchParams);

  let result: AdminAuditLogListResult | null = null;
  let hasQueryError = false;

  try {
    result = await listAdminAuditLogs(filters);
  } catch {
    hasQueryError = true;
    captureOperationalError(
      new Error("Failed to query admin audit logs"),
      {
        service: "neon",
        operation: "list_admin_audit_logs",
      }
    );
  }

  return (
    <Container className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Nhật ký hoạt động
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Bản ghi kiểm toán chỉ đọc (append-only) đối với các thao tác xác thực,
          thay đổi trạng thái xử lý yêu cầu tư vấn và đồng bộ thông báo quản trị.
        </p>
      </div>

      <AuditLogFilters filters={filters} />

      {hasQueryError || !result ? (
        <Card className="border-red-300 bg-red-50/40">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-900">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-red-950 sm:text-lg">
              Không thể tải nhật ký hoạt động lúc này
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-red-900/90">
              Hệ thống đang gặp sự cố tạm thời khi truy vấn nhật ký quản trị. Vui
              lòng thử lại sau ít phút.
            </p>
            <div className="mt-5">
              <Link
                href={ADMIN_AUDIT_LOGS_PATH}
                className={getButtonClassName({
                  variant: "outline",
                  size: "sm",
                  className: "gap-2 bg-card",
                })}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Thử tải lại</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AuditLogsList result={result} filters={filters} />
      )}
    </Container>
  );
}

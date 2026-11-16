"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ADMIN_AUDIT_ACTION_FILTER_OPTIONS,
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_AUDIT_PERIOD_FILTER_OPTIONS,
  ADMIN_AUDIT_RESULT_FILTER_OPTIONS,
  type AdminAuditFilters,
  adminAuditActionSchema,
  adminAuditPeriodFilterSchema,
  adminAuditResultSchema,
  buildAdminAuditLogsHref,
  hasActiveAdminAuditFilters,
} from "@/schemas/admin-audit";

interface AuditLogFiltersProps {
  filters: AdminAuditFilters;
}

export function AuditLogFilters({ filters }: AuditLogFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [action, setAction] = useState<string>(filters.action ?? "");
  const [result, setResult] = useState<string>(filters.result ?? "");
  const [period, setPeriod] = useState<string>(filters.period ?? "");

  useEffect(() => {
    setAction(filters.action ?? "");
    setResult(filters.result ?? "");
    setPeriod(filters.period ?? "");
  }, [filters.action, filters.result, filters.period]);

  const hasFilters = hasActiveAdminAuditFilters(filters);

  const navigateWithFilters = (next: {
    action?: string;
    result?: string;
    period?: string;
  }) => {
    const parsedAction = next.action
      ? adminAuditActionSchema.safeParse(next.action)
      : null;
    const parsedResult = next.result
      ? adminAuditResultSchema.safeParse(next.result)
      : null;
    const parsedPeriod = next.period
      ? adminAuditPeriodFilterSchema.safeParse(next.period)
      : null;

    const href = buildAdminAuditLogsHref({
      ...(parsedAction?.success ? { action: parsedAction.data } : {}),
      ...(parsedResult?.success ? { result: parsedResult.data } : {}),
      ...(parsedPeriod?.success ? { period: parsedPeriod.data } : {}),
    });

    startTransition(() => {
      router.push(href);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithFilters({
      action,
      result,
      period,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          method="get"
          action={ADMIN_AUDIT_LOGS_PATH}
          onSubmit={handleSubmit}
          aria-label="Lọc nhật ký hoạt động quản trị"
          aria-busy={isPending}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="audit-filter-action"
                className="block text-xs font-semibold text-foreground"
              >
                Loại thao tác
              </label>
              <select
                id="audit-filter-action"
                name="action"
                value={action}
                onChange={(event) => {
                  const nextAction = event.target.value;
                  setAction(nextAction);
                  navigateWithFilters({
                    action: nextAction,
                    result,
                    period,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả thao tác</option>
                {ADMIN_AUDIT_ACTION_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="audit-filter-result"
                className="block text-xs font-semibold text-foreground"
              >
                Kết quả thực hiện
              </label>
              <select
                id="audit-filter-result"
                name="result"
                value={result}
                onChange={(event) => {
                  const nextResult = event.target.value;
                  setResult(nextResult);
                  navigateWithFilters({
                    action,
                    result: nextResult,
                    period,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả kết quả</option>
                {ADMIN_AUDIT_RESULT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="audit-filter-period"
                className="block text-xs font-semibold text-foreground"
              >
                Khoảng thời gian
              </label>
              <select
                id="audit-filter-period"
                name="period"
                value={period}
                onChange={(event) => {
                  const nextPeriod = event.target.value;
                  setPeriod(nextPeriod);
                  navigateWithFilters({
                    action,
                    result,
                    period: nextPeriod,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả thời gian</option>
                {ADMIN_AUDIT_PERIOD_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="gap-2"
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span>{isPending ? "Đang lọc..." : "Áp dụng bộ lọc"}</span>
              </Button>

              {hasFilters ? (
                <Link
                  href={ADMIN_AUDIT_LOGS_PATH}
                  className={getButtonClassName({
                    variant: "outline",
                    size: "sm",
                    className: "gap-2",
                  })}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xoá bộ lọc</span>
                </Link>
              ) : null}
            </div>

            {isPending ? (
              <p className="text-xs text-muted-foreground" role="status">
                Đang cập nhật nhật ký...
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

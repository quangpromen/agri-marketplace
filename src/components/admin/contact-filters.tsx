"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CONTACT_STATUS_OPTIONS,
  EMAIL_STATUS_OPTIONS,
} from "@/lib/admin-contact-presentation";
import {
  ADMIN_CONTACTS_PATH,
  type AdminContactFilters,
  type ContactSubmissionStatus,
  type EmailDeliveryStatus,
  MAX_ADMIN_CONTACT_SEARCH_LENGTH,
  buildAdminContactsHref,
  hasActiveAdminContactFilters,
} from "@/schemas/admin-contact";
import type { ContactServiceOption } from "@/server/admin/contact-submissions";

interface ContactFiltersProps {
  filters: AdminContactFilters;
  serviceOptions: ContactServiceOption[];
}

export function ContactFilters({ filters, serviceOptions }: ContactFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(filters.q ?? "");
  const [status, setStatus] = useState<string>(filters.status ?? "");
  const [emailStatus, setEmailStatus] = useState<string>(filters.emailStatus ?? "");
  const [service, setService] = useState<string>(filters.service ?? "");

  useEffect(() => {
    setQuery(filters.q ?? "");
    setStatus(filters.status ?? "");
    setEmailStatus(filters.emailStatus ?? "");
    setService(filters.service ?? "");
  }, [filters.q, filters.status, filters.emailStatus, filters.service]);

  const hasFilters = hasActiveAdminContactFilters(filters);

  const navigateWithFilters = (next: {
    q?: string;
    status?: string;
    emailStatus?: string;
    service?: string;
  }) => {
    const trimmedQuery = next.q?.trim();
    const href = buildAdminContactsHref({
      ...(trimmedQuery ? { q: trimmedQuery.slice(0, MAX_ADMIN_CONTACT_SEARCH_LENGTH) } : {}),
      ...(next.status ? { status: next.status as ContactSubmissionStatus } : {}),
      ...(next.emailStatus
        ? { emailStatus: next.emailStatus as EmailDeliveryStatus }
        : {}),
      ...(next.service ? { service: next.service } : {}),
      page: 1,
    });

    startTransition(() => {
      router.push(href);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithFilters({
      q: query,
      status,
      emailStatus,
      service,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          method="get"
          action={ADMIN_CONTACTS_PATH}
          onSubmit={handleSubmit}
          aria-label="Tìm kiếm và lọc yêu cầu tư vấn"
          aria-busy={isPending}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
            <div className="space-y-1.5 xl:col-span-4">
              <label
                htmlFor="contact-filter-q"
                className="block text-xs font-semibold text-foreground"
              >
                Tìm kiếm (tên, email, số điện thoại)
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="contact-filter-q"
                  name="q"
                  type="search"
                  value={query}
                  maxLength={MAX_ADMIN_CONTACT_SEARCH_LENGTH}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nhập họ tên, email hoặc số điện thoại..."
                  className="focus-ring h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5 xl:col-span-2">
              <label
                htmlFor="contact-filter-status"
                className="block text-xs font-semibold text-foreground"
              >
                Trạng thái xử lý
              </label>
              <select
                id="contact-filter-status"
                name="status"
                value={status}
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  setStatus(nextStatus);
                  navigateWithFilters({
                    q: query,
                    status: nextStatus,
                    emailStatus,
                    service,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả</option>
                {CONTACT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 xl:col-span-3">
              <label
                htmlFor="contact-filter-email-status"
                className="block text-xs font-semibold text-foreground"
              >
                Trạng thái gửi email
              </label>
              <select
                id="contact-filter-email-status"
                name="emailStatus"
                value={emailStatus}
                onChange={(event) => {
                  const nextEmailStatus = event.target.value;
                  setEmailStatus(nextEmailStatus);
                  navigateWithFilters({
                    q: query,
                    status,
                    emailStatus: nextEmailStatus,
                    service,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả</option>
                {EMAIL_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 xl:col-span-3">
              <label
                htmlFor="contact-filter-service"
                className="block text-xs font-semibold text-foreground"
              >
                Dịch vụ quan tâm
              </label>
              <select
                id="contact-filter-service"
                name="service"
                value={service}
                onChange={(event) => {
                  const nextService = event.target.value;
                  setService(nextService);
                  navigateWithFilters({
                    q: query,
                    status,
                    emailStatus,
                    service: nextService,
                  });
                }}
                className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tất cả</option>
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button type="submit" size="sm" disabled={isPending} className="gap-2">
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>{isPending ? "Đang tìm..." : "Tìm kiếm"}</span>
              </Button>

              {hasFilters ? (
                <Link
                  href={ADMIN_CONTACTS_PATH}
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
                Đang cập nhật danh sách...
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


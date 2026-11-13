import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContactFilters } from "@/components/admin/contact-filters";
import { ContactSubmissionsList } from "@/components/admin/contact-submissions-list";
import { Container } from "@/components/ui/container";
import { constructMetadata } from "@/lib/metadata";
import {
  type RawSearchParams,
  buildAdminContactsHref,
  parseAdminContactSearchParams,
} from "@/schemas/admin-contact";
import {
  listContactSubmissions,
  listDistinctContactServices,
} from "@/server/admin/contact-submissions";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Quản lý yêu cầu tư vấn",
  description: "Danh sách, tìm kiếm và lọc yêu cầu tư vấn nội bộ Mộc Farm.",
  noIndex: true,
});

interface AdminContactListPageProps {
  searchParams?: RawSearchParams;
}

export default async function AdminContactListPage({
  searchParams,
}: AdminContactListPageProps) {
  await requireAdmin();

  const filters = parseAdminContactSearchParams(searchParams);

  const [result, serviceOptions] = await Promise.all([
    listContactSubmissions(filters),
    listDistinctContactServices(),
  ]);

  if (result.isOutOfRange) {
    redirect(
      buildAdminContactsHref({
        ...filters,
        page: result.totalPages,
      })
    );
  }

  return (
    <Container className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Quản lý yêu cầu tư vấn
        </h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi các yêu cầu được gửi từ form liên hệ trên website, tìm kiếm, lọc theo trạng thái
          và kiểm tra tình trạng gửi email thông báo.
        </p>
      </div>

      <ContactFilters filters={filters} serviceOptions={serviceOptions} />

      <ContactSubmissionsList result={result} filters={filters} />
    </Container>
  );
}


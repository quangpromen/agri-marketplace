import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Mail,
  MessageSquareText,
  Phone,
  Sprout,
  User,
} from "lucide-react";
import { ContactStatusForm } from "@/components/admin/contact-status-form";
import {
  ContactStatusBadge,
  EmailStatusBadge,
} from "@/components/admin/contact-status-badges";
import { getButtonClassName } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  CONTACT_STATUS_META,
  EMAIL_STATUS_META,
  formatAdminDateTime,
} from "@/lib/admin-contact-presentation";
import { constructMetadata } from "@/lib/metadata";
import {
  type RawSearchParams,
  buildAdminContactsHref,
  getSafeMailtoHref,
  getSafeTelHref,
  parseAdminContactSearchParams,
} from "@/schemas/admin-contact";
import { getContactServiceLabel } from "@/schemas/contact";
import { getContactSubmissionById } from "@/server/admin/contact-submissions";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Chi tiết yêu cầu tư vấn",
  description: "Xem và cập nhật trạng thái xử lý yêu cầu tư vấn nội bộ Mộc Farm.",
  noIndex: true,
});

interface AdminContactDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: RawSearchParams;
}

export default async function AdminContactDetailPage({
  params,
  searchParams,
}: AdminContactDetailPageProps) {
  await requireAdmin();

  const submission = await getContactSubmissionById(params.id);

  if (!submission) {
    notFound();
  }

  const backFilters = parseAdminContactSearchParams(searchParams);
  const backHref = buildAdminContactsHref(backFilters);
  const mailtoHref = getSafeMailtoHref(submission.email);
  const telHref = getSafeTelHref(submission.phone);

  return (
    <Container className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backHref}
          className={getButtonClassName({
            variant: "outline",
            size: "sm",
            className: "gap-2",
          })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại danh sách yêu cầu</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <ContactStatusBadge status={submission.status} />
          <EmailStatusBadge status={submission.emailStatus} />
        </div>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Chi tiết yêu cầu tư vấn
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Mã yêu cầu: <span className="font-mono text-foreground">{submission.id}</span>
        </p>
      </div>

      {submission.emailStatus === "failed" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-950 shadow-sm"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-800"
            aria-hidden="true"
          />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-red-900">
              Email thông báo đã gửi thất bại
            </p>
            <p className="leading-relaxed text-red-900/90">
              Hệ thống không thể gửi email thông báo cho yêu cầu này. Quản trị viên nên chủ động
              liên hệ trực tiếp với khách hàng qua số điện thoại hoặc địa chỉ email bên dưới.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Thông tin khách hàng</CardTitle>
              <CardDescription>
                Thông tin liên hệ do khách hàng cung cấp qua biểu mẫu trên website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border border-border/70 bg-cream/30 p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Họ và tên</span>
                  </dt>
                  <dd className="font-semibold text-foreground">{submission.name}</dd>
                </div>

                <div className="space-y-1 rounded-lg border border-border/70 bg-cream/30 p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Số điện thoại</span>
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {telHref ? (
                      <a
                        href={telHref}
                        className="focus-ring inline-flex rounded-sm text-primary underline-offset-4 hover:underline"
                      >
                        {submission.phone}
                      </a>
                    ) : (
                      submission.phone
                    )}
                  </dd>
                </div>

                <div className="space-y-1 rounded-lg border border-border/70 bg-cream/30 p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Email</span>
                  </dt>
                  <dd className="break-all font-semibold text-foreground">
                    {mailtoHref ? (
                      <a
                        href={mailtoHref}
                        className="focus-ring inline-flex rounded-sm text-primary underline-offset-4 hover:underline"
                      >
                        {submission.email}
                      </a>
                    ) : (
                      submission.email
                    )}
                  </dd>
                </div>

                <div className="space-y-1 rounded-lg border border-border/70 bg-cream/30 p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Sprout className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Dịch vụ quan tâm</span>
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {getContactServiceLabel(submission.service)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 text-primary">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Nội dung tin nhắn</CardTitle>
              <CardDescription>
                Toàn bộ nội dung lời nhắn được hiển thị nguyên văn theo định dạng văn bản thuần.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap break-words rounded-xl border border-border bg-cream/30 p-4 text-sm leading-relaxed text-foreground">
                {submission.message}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Xử lý yêu cầu</CardTitle>
              <CardDescription>
                Cập nhật trạng thái chăm sóc khách hàng trên máy chủ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactStatusForm
                submissionId={submission.id}
                currentStatus={submission.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-foreground">
                <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>Trạng thái &amp; mốc thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Trạng thái xử lý hiện tại
                  </dt>
                  <dd className="flex items-center justify-between gap-2">
                    <ContactStatusBadge status={submission.status} />
                    <span className="text-right text-xs text-muted-foreground">
                      {CONTACT_STATUS_META[submission.status].description}
                    </span>
                  </dd>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Trạng thái gửi email
                  </dt>
                  <dd className="flex items-center justify-between gap-2">
                    <EmailStatusBadge status={submission.emailStatus} />
                    <span className="text-right text-xs text-muted-foreground">
                      {EMAIL_STATUS_META[submission.emailStatus].description}
                    </span>
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2.5">
                  <dt className="text-muted-foreground">Thời gian tạo</dt>
                  <dd className="font-medium text-foreground">
                    {formatAdminDateTime(submission.createdAt)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 pt-0.5">
                  <dt className="text-muted-foreground">Cập nhật gần nhất</dt>
                  <dd className="font-medium text-foreground">
                    {formatAdminDateTime(submission.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}


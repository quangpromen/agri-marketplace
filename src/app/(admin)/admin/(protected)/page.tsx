import React from "react";
import Link from "next/link";
import { ArrowRight, Inbox, UserCheck } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ADMIN_CONTACTS_PATH } from "@/schemas/admin-contact";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <Container className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Trang quản trị Mộc Farm
        </h1>
        <p className="text-sm text-muted-foreground">
          Xin chào <span className="font-semibold text-foreground">{user.name}</span> ({user.email}
          ). Phiên làm việc quản trị của bạn đã được xác minh an toàn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Thông tin phiên quản trị</CardTitle>
            <CardDescription>
              Tài khoản đang đăng nhập và được xác thực từ máy chủ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Họ và tên</span>
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-muted-foreground">Email</span>
              <span className="break-all font-medium text-foreground">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-foreground">
              <Inbox className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Quản lý yêu cầu tư vấn</CardTitle>
            <CardDescription>
              Xem danh sách liên hệ từ khách hàng, tìm kiếm, lọc theo trạng thái và cập nhật tiến
              độ xử lý.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Link
              href={ADMIN_CONTACTS_PATH}
              className={getButtonClassName({
                variant: "default",
                className: "gap-2",
              })}
            >
              <span>Xem yêu cầu tư vấn</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </Container>
  );
}


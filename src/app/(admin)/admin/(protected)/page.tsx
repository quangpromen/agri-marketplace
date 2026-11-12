import React from "react";
import { ShieldCheck, UserCheck } from "lucide-react";
import { AdminLogoutButton } from "@/components/forms/admin-logout-button";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <Container className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Quản trị viên
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <AdminLogoutButton />
          </div>
        </Container>
      </header>

      <main id="main-content" className="flex-1 py-10">
        <Container className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Trang quản trị Mộc Farm
            </h1>
            <p className="text-sm text-muted-foreground">
              Xin chào <span className="font-semibold text-foreground">{user.name}</span> ({user.email}). Phiên làm việc quản trị của bạn đã được xác minh an toàn.
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
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Họ và tên</span>
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle>Trạng thái hệ thống</CardTitle>
                <CardDescription>
                  Chặng 1 — Xác thực trang quản trị bằng Better Auth đã sẵn sàng.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Các phân hệ quản lý dữ liệu nội bộ sẽ được tích hợp ở các chặng tiếp theo.
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}


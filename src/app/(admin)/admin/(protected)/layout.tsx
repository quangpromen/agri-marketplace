import type { Metadata } from "next";
import React from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLogoutButton } from "@/components/forms/admin-logout-button";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/ui/container";
import { constructMetadata } from "@/lib/metadata";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Trang quản trị Mộc Farm",
  description: "Khu vực quản trị nội bộ Mộc Farm.",
  noIndex: true,
});

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-cream/40">
      <header className="border-b border-border bg-card">
        <Container className="flex min-h-[72px] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Logo />
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Quản trị viên
            </span>
          </div>

          <div className="order-3 w-full lg:order-2 lg:w-auto">
            <AdminNav />
          </div>

          <div className="order-2 flex items-center gap-3 sm:gap-4 lg:order-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="max-w-[180px] truncate font-semibold text-foreground">{user.name}</p>
              <p className="max-w-[220px] truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <AdminLogoutButton />
          </div>
        </Container>
      </header>

      <main id="main-content" className="flex-1 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}


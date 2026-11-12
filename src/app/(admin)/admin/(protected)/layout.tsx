import type { Metadata } from "next";
import React from "react";
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
  await requireAdmin();

  return <div className="min-h-screen bg-cream/40">{children}</div>;
}


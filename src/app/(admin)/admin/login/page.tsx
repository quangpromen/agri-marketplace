import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { constructMetadata } from "@/lib/metadata";
import { sanitizeCallbackUrl } from "@/schemas/auth";
import { getSession } from "@/server/auth/get-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = constructMetadata({
  title: "Đăng nhập quản trị",
  description: "Cổng đăng nhập quản trị nội bộ Mộc Farm.",
  noIndex: true,
});

interface AdminLoginPageProps {
  searchParams?: {
    callbackUrl?: string | string[];
    callbackURL?: string | string[];
  };
}

function extractCallbackParam(
  searchParams?: AdminLoginPageProps["searchParams"]
): string | undefined {
  const raw = searchParams?.callbackURL ?? searchParams?.callbackUrl;
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const safeCallbackUrl = sanitizeCallbackUrl(extractCallbackParam(searchParams));
  const session = await getSession();

  if (session) {
    redirect(safeCallbackUrl);
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col justify-center bg-cream/60 py-12"
    >
      <Container className="max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Hệ thống quản trị nội bộ
          </span>
        </div>

        <Card className="border-border/80 bg-card shadow-md">
          <CardHeader className="space-y-2 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Đăng nhập quản trị
            </h1>
            <CardDescription>
              Vui lòng đăng nhập bằng tài khoản quản trị viên Mộc Farm để tiếp tục.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm callbackUrl={safeCallbackUrl} />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}


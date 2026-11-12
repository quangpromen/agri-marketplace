"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="default"
      disabled={pending}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>{pending ? "Đang đăng xuất..." : "Đăng xuất"}</span>
    </Button>
  );
}

export function AdminLogoutButton() {
  return (
    <form action={logoutAdmin} aria-label="Biểu mẫu đăng xuất quản trị">
      <LogoutSubmitButton />
    </form>
  );
}


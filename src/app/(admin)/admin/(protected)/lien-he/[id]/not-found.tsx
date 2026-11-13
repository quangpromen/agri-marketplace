import React from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ADMIN_CONTACTS_PATH } from "@/schemas/admin-contact";

export default function AdminContactDetailNotFound() {
  return (
    <Container className="py-6">
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
            <SearchX className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Không tìm thấy yêu cầu tư vấn
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Yêu cầu bạn đang tìm kiếm không tồn tại, mã yêu cầu không hợp lệ hoặc đã bị xoá khỏi hệ
            thống.
          </p>
          <div className="mt-6">
            <Link
              href={ADMIN_CONTACTS_PATH}
              className={getButtonClassName({
                variant: "default",
                className: "gap-2",
              })}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Quay lại danh sách yêu cầu</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}


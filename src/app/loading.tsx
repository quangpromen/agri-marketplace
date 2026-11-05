import React from "react";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <Container className="flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Đang tải nội dung Mộc Farm...
        </p>
      </Container>
    </div>
  );
}

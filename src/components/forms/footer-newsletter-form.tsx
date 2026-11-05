"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FooterNewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 text-xs text-cream">
        <Check className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
        <span>Cảm ơn bạn đã đăng ký nhận tin!</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
      aria-label="Đăng ký nhận bản tin ở chân trang"
    >
      <div>
        <label htmlFor="footer-email-input" className="sr-only">
          Địa chỉ email
        </label>
        <input
          id="footer-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email của bạn..."
          className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-cream/50 focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="min-h-[38px] w-full gap-1.5 text-xs font-semibold"
      >
        <span>Đăng ký ngay</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </form>
  );
}

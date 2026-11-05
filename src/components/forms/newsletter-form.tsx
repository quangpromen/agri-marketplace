"use client";

import React, { useState } from "react";
import { Send, Check } from "lucide-react";

export function NewsletterForm() {
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
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/20 p-4 text-sm font-semibold text-accent">
        <Check className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span>Cảm ơn bạn! Mộc Farm sẽ gửi bản tin mùa vụ định kỳ đến bạn.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto w-full max-w-xl"
      aria-label="Đăng ký nhận thông tin nông sản"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Địa chỉ email nhận tin
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập địa chỉ email của bạn..."
        required
        className="h-14 w-full rounded-full border-0 bg-white pl-6 pr-20 text-sm text-dark shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-accent/40 sm:h-16 sm:text-base"
      />
      <button
        type="submit"
        aria-label="Gửi đăng ký nhận tin"
        className="focus-ring absolute right-2 top-1.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-dark shadow-md transition-colors hover:bg-white sm:right-2 sm:top-2 sm:h-12 sm:w-12"
      >
        <Send className="h-5 w-5 text-dark" aria-hidden="true" />
      </button>
    </form>
  );
}

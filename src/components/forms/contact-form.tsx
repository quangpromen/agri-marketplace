"use client";

import React, { useState } from "react";
import { Send, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "hop-rau-tuan",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h4 className="text-xl font-bold text-foreground">Gửi Tin Nhắn Thành Công!</h4>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Cảm ơn bạn {formData.name || ""}. Đội ngũ kỹ sư Mộc Farm đã nhận được yêu cầu và sẽ liên
          hệ lại qua số điện thoại sớm nhất có thể.
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: "", phone: "", email: "", service: "hop-rau-tuan", message: "" });
            }}
          >
            Gửi yêu cầu khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Biểu mẫu liên hệ Mộc Farm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-foreground">
            Họ và tên của bạn <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nguyễn Văn A"
            required
            className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-phone" className="text-xs font-semibold text-foreground">
            Số điện thoại liên hệ <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0912 345 678"
            required
            className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="text-xs font-semibold text-foreground">
          Địa chỉ email <span className="text-destructive">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
          required
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-service" className="text-xs font-semibold text-foreground">
          Chủ đề bạn quan tâm
        </label>
        <select
          id="contact-service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground"
        >
          <option value="hop-rau-tuan">Mua nông sản / Hộp rau gia đình</option>
          <option value="cung-ung-bep-an">Cung ứng cho nhà hàng / Siêu thị</option>
          <option value="chuyen-giao-ky-thuat">Tư vấn chuyển giao kỹ thuật canh tác</option>
          <option value="tham-quan-nong-trai">Đặt lịch tham quan trải nghiệm nông trại</option>
          <option value="khac">Chủ đề khác</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="text-xs font-semibold text-foreground">
          Nội dung tin nhắn <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Hãy chia sẻ nhu cầu hoặc câu hỏi cụ thể của bạn..."
          required
          className="focus-ring w-full resize-y rounded-lg border border-border bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" variant="default" size="lg" className="w-full gap-2 font-bold">
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>Gửi thông tin liên hệ</span>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>Mộc Farm cam kết bảo mật tuyệt đối thông tin liên hệ của bạn.</span>
      </div>
    </form>
  );
}

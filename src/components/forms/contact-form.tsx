"use client";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { submitContact, type ContactFormState } from "@/actions/submit-contact";
import { TurnstileField } from "@/components/forms/turnstile-field";
import { Button } from "@/components/ui/button";

const initialValues = {
  name: "",
  phone: "",
  email: "",
  service: "hop-rau-tuan",
  message: "",
};

const initialContactFormState: ContactFormState = {
  status: "idle",
};

function ContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="default"
      size="lg"
      disabled={pending}
      className="w-full gap-2 font-bold"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      <span>{pending ? "Đang gửi thông tin..." : "Gửi thông tin liên hệ"}</span>
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(submitContact, initialContactFormState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    if (state.status === "success") {
      setShowSuccess(true);
    }
  }, [state.status]);

  if (showSuccess) {
    return (
      <div
        className="space-y-3 rounded-2xl border border-primary/20 bg-primary/10 p-8 text-center"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h4 className="text-xl font-bold text-foreground">Gửi Tin Nhắn Thành Công!</h4>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Cảm ơn bạn {state.submittedName ?? ""}. Đội ngũ kỹ sư Mộc Farm đã nhận được yêu cầu và sẽ
          liên hệ lại qua số điện thoại sớm nhất có thể.
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData(initialValues);
              setShowSuccess(false);
            }}
          >
            Gửi yêu cầu khác
          </Button>
        </div>
      </div>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      className="space-y-4"
      aria-label="Biểu mẫu liên hệ Mộc Farm"
      noValidate
    >
      <div aria-live="polite">
        {(state.status === "error" || state.status === "rate_limited") && state.message ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          error={fieldErrors.name?.[0]}
          id="contact-name"
          label="Họ và tên của bạn"
          required
        >
          <input
            id="contact-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name?.length)}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </FormField>

        <FormField
          error={fieldErrors.phone?.[0]}
          id="contact-phone"
          label="Số điện thoại liên hệ"
          required
        >
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
            placeholder="0912 345 678"
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone?.length)}
            aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
            className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </FormField>
      </div>

      <FormField error={fieldErrors.email?.[0]} id="contact-email" label="Địa chỉ email" required>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
          placeholder="email@example.com"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email?.length)}
          aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </FormField>

      <FormField error={fieldErrors.service?.[0]} id="contact-service" label="Chủ đề bạn quan tâm">
        <select
          id="contact-service"
          name="service"
          value={formData.service}
          onChange={(event) => setFormData({ ...formData, service: event.target.value })}
          aria-invalid={Boolean(fieldErrors.service?.length)}
          aria-describedby={fieldErrors.service ? "contact-service-error" : undefined}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground"
        >
          <option value="hop-rau-tuan">Mua nông sản / Hộp rau gia đình</option>
          <option value="cung-ung-bep-an">Cung ứng cho nhà hàng / Siêu thị</option>
          <option value="chuyen-giao-ky-thuat">Tư vấn chuyển giao kỹ thuật canh tác</option>
          <option value="tham-quan-nong-trai">Đặt lịch tham quan trải nghiệm nông trại</option>
          <option value="khac">Chủ đề khác</option>
        </select>
      </FormField>

      <FormField
        error={fieldErrors.message?.[0]}
        id="contact-message"
        label="Nội dung tin nhắn"
        required
      >
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={(event) => setFormData({ ...formData, message: event.target.value })}
          placeholder="Hãy chia sẻ nhu cầu hoặc câu hỏi cụ thể của bạn..."
          aria-invalid={Boolean(fieldErrors.message?.length)}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          className="focus-ring w-full resize-y rounded-lg border border-border bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </FormField>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <TurnstileField
        error={fieldErrors.turnstileToken?.[0]}
        resetSignal={
          state.status === "validation_error" ||
          state.status === "rate_limited" ||
          state.status === "error"
            ? state
            : null
        }
        theme="light"
        tone="light"
      />

      <div className="pt-2">
        <ContactSubmitButton />
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>Mộc Farm cam kết bảo mật tuyệt đối thông tin liên hệ của bạn.</span>
      </div>
    </form>
  );
}

function FormField({
  children,
  error,
  id,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

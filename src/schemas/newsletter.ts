import { z } from "zod";

export const newsletterSubscriptionSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vui lòng nhập địa chỉ email hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  website: z.string().max(0, "Yêu cầu không hợp lệ."),
});

export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionSchema>;

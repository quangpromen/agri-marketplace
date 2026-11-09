import { describe, expect, it } from "vitest";
import { contactSubmissionSchema } from "@/schemas/contact";
import { newsletterSubscriptionSchema } from "@/schemas/newsletter";

describe("contactSubmissionSchema", () => {
  const validContact = {
    name: "  Nguyễn Văn An  ",
    phone: "0912 345 678",
    email: "  AN@Example.COM ",
    service: "hop-rau-tuan",
    message: "  Tôi muốn được tư vấn thêm.  ",
    website: "",
  } as const;

  it("chuẩn hóa chuỗi, email và số điện thoại Việt Nam", () => {
    const result = contactSubmissionSchema.parse(validContact);

    expect(result).toMatchObject({
      name: "Nguyễn Văn An",
      phone: "0912345678",
      email: "an@example.com",
      message: "Tôi muốn được tư vấn thêm.",
    });
  });

  it.each(["(+84) 912.345.678", "+84-912-345-678", "0912.345.678"])(
    "chấp nhận và chuẩn hóa định dạng điện thoại %s",
    (phone) => {
      expect(contactSubmissionSchema.parse({ ...validContact, phone }).phone).toMatch(
        /^(?:\+84|0)\d{9}$/
      );
    }
  );

  it("từ chối số điện thoại, email và honeypot không hợp lệ", () => {
    const result = contactSubmissionSchema.safeParse({
      ...validContact,
      phone: "012345",
      email: "khong-phai-email",
      website: "spam.example",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        phone: expect.any(Array),
        email: expect.any(Array),
        website: expect.any(Array),
      });
    }
  });
});

describe("newsletterSubscriptionSchema", () => {
  it("trim và chuyển email về chữ thường", () => {
    expect(
      newsletterSubscriptionSchema.parse({ email: "  News@Example.COM ", website: "" })
    ).toEqual({ email: "news@example.com", website: "" });
  });

  it("từ chối email sai và honeypot có dữ liệu", () => {
    expect(
      newsletterSubscriptionSchema.safeParse({ email: "invalid", website: "bot" }).success
    ).toBe(false);
  });
});

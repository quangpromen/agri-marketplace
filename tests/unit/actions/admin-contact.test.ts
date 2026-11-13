import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  updateContactSubmissionStatus: vi.fn(),
  revalidatePath: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/admin/contact-submissions", () => ({
  updateContactSubmissionStatus: mocks.updateContactSubmissionStatus,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

import { updateContactSubmissionStatusAction } from "@/actions/admin-contact";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function makeFormData(id: string, status: string, extra?: Record<string, string>) {
  const formData = new FormData();
  formData.set("id", id);
  formData.set("status", status);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      formData.set(key, value);
    }
  }
  return formData;
}

describe("updateContactSubmissionStatusAction Server Action", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: { id: "admin-1", email: "admin@mocfarm.vn", name: "Admin" },
      session: { id: "sess-1", userId: "admin-1", token: "tok" },
    });
    mocks.updateContactSubmissionStatus.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.captureOperationalError.mockReset();
  });

  it("từ chối mutation khi không có phiên admin (requireAdmin chuyển hướng /admin/login)", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(
      updateContactSubmissionStatusAction(
        { status: "idle" },
        makeFormData(VALID_UUID, "contacted")
      )
    ).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(mocks.updateContactSubmissionStatus).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("từ chối id hoặc status không hợp lệ trước khi chạm DB", async () => {
    const invalidIdResult = await updateContactSubmissionStatusAction(
      { status: "idle" },
      makeFormData("not-a-uuid", "contacted")
    );
    expect(invalidIdResult.status).toBe("validation_error");

    const invalidStatusResult = await updateContactSubmissionStatusAction(
      { status: "idle" },
      makeFormData(VALID_UUID, "failed")
    );
    expect(invalidStatusResult.status).toBe("validation_error");

    expect(mocks.updateContactSubmissionStatus).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("chỉ truyền id và status hợp lệ, không truyền trường thừa từ client, và revalidate đúng route", async () => {
    const updatedAt = new Date("2026-11-13T10:15:00Z");
    mocks.updateContactSubmissionStatus.mockResolvedValueOnce({
      ok: true,
      data: {
        id: VALID_UUID,
        status: "resolved",
        updatedAt,
      },
    });

    const result = await updateContactSubmissionStatusAction(
      { status: "idle" },
      makeFormData(VALID_UUID, "resolved", {
        emailStatus: "sent",
        table: "user",
        column: "role",
      })
    );

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.updateContactSubmissionStatus).toHaveBeenCalledWith({
      id: VALID_UUID,
      status: "resolved",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/lien-he");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/admin/lien-he/${VALID_UUID}`
    );
    expect(result).toEqual({
      status: "success",
      message: 'Đã cập nhật trạng thái xử lý thành "Đã xử lý".',
      updatedStatus: "resolved",
      updatedAt: updatedAt.toISOString(),
    });
  });

  it("trả về not_found khi bản ghi không tồn tại", async () => {
    mocks.updateContactSubmissionStatus.mockResolvedValueOnce({
      ok: false,
      reason: "not_found",
    });

    const result = await updateContactSubmissionStatusAction(
      { status: "idle" },
      makeFormData(VALID_UUID, "spam")
    );

    expect(result).toEqual({
      status: "not_found",
      message: "Không tìm thấy yêu cầu tư vấn cần cập nhật.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("bắt lỗi DB an toàn, ghi nhận observability và không trả chi tiết lỗi DB cho client", async () => {
    mocks.updateContactSubmissionStatus.mockRejectedValueOnce(
      new Error("neon error: password=secret email=customer@example.com")
    );

    const result = await updateContactSubmissionStatusAction(
      { status: "idle" },
      makeFormData(VALID_UUID, "contacted")
    );

    expect(mocks.captureOperationalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        service: "neon",
        operation: "update_contact_submission_status",
      })
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("neon error");
    expect(result.message).not.toContain("secret");
    expect(result.message).not.toContain("customer@example.com");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});


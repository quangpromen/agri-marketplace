"use server";

import { revalidatePath } from "next/cache";
import { CONTACT_STATUS_META } from "@/lib/admin-contact-presentation";
import {
  ADMIN_CONTACTS_PATH,
  type ContactSubmissionStatus,
  updateContactStatusSchema,
} from "@/schemas/admin-contact";
import { updateContactSubmissionStatus } from "@/server/admin/contact-submissions";
import { requireAdmin } from "@/server/auth/require-admin";
import { captureOperationalError } from "@/server/observability/capture-error";

export type UpdateContactStatusActionState = {
  status: "idle" | "success" | "validation_error" | "not_found" | "error";
  message?: string;
  updatedStatus?: ContactSubmissionStatus;
  updatedAt?: string;
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateContactSubmissionStatusAction(
  _previousState: UpdateContactStatusActionState,
  formData: FormData
): Promise<UpdateContactStatusActionState> {
  await requireAdmin();

  const parsed = updateContactStatusSchema.safeParse({
    id: getFormValue(formData, "id"),
    status: getFormValue(formData, "status"),
  });

  if (!parsed.success) {
    return {
      status: "validation_error",
      message: "Mã yêu cầu hoặc trạng thái xử lý không hợp lệ.",
    };
  }

  try {
    const result = await updateContactSubmissionStatus(parsed.data);

    if (!result.ok) {
      if (result.reason === "not_found") {
        return {
          status: "not_found",
          message: "Không tìm thấy yêu cầu tư vấn cần cập nhật.",
        };
      }

      return {
        status: "validation_error",
        message: "Mã yêu cầu hoặc trạng thái xử lý không hợp lệ.",
      };
    }

    revalidatePath(ADMIN_CONTACTS_PATH);
    revalidatePath(`${ADMIN_CONTACTS_PATH}/${result.data.id}`);

    return {
      status: "success",
      message: `Đã cập nhật trạng thái xử lý thành "${CONTACT_STATUS_META[result.data.status].label}".`,
      updatedStatus: result.data.status,
      updatedAt: result.data.updatedAt.toISOString(),
    };
  } catch (error) {
    captureOperationalError(error, {
      service: "neon",
      operation: "update_contact_submission_status",
    });

    return {
      status: "error",
      message: "Không thể cập nhật trạng thái lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}


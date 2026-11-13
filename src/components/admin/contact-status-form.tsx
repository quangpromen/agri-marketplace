"use client";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import {
  updateContactSubmissionStatusAction,
  type UpdateContactStatusActionState,
} from "@/actions/admin-contact";
import { Button } from "@/components/ui/button";
import { CONTACT_STATUS_OPTIONS } from "@/lib/admin-contact-presentation";
import type { ContactSubmissionStatus } from "@/schemas/admin-contact";

const initialState: UpdateContactStatusActionState = {
  status: "idle",
};

interface ContactStatusFormProps {
  submissionId: string;
  currentStatus: ContactSubmissionStatus;
}

function StatusSubmitButton({ isUnchanged }: { isUnchanged: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || isUnchanged}
      className="w-full gap-2 sm:w-auto"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      <span>{pending ? "Đang cập nhật..." : "Cập nhật trạng thái"}</span>
    </Button>
  );
}

function StatusFormFields({
  currentStatus,
  state,
}: {
  currentStatus: ContactSubmissionStatus;
  state: UpdateContactStatusActionState;
}) {
  const { pending } = useFormStatus();
  const [selectedStatus, setSelectedStatus] =
    useState<ContactSubmissionStatus>(currentStatus);
  const [hasEditedSinceLastSubmit, setHasEditedSinceLastSubmit] = useState(false);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    if (state.status !== "idle") {
      setHasEditedSinceLastSubmit(false);
    }
  }, [state]);

  const showFeedback = !hasEditedSinceLastSubmit && state.status !== "idle";
  const isError =
    state.status === "validation_error" ||
    state.status === "not_found" ||
    state.status === "error";

  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor="contact-detail-status"
          className="block text-xs font-semibold text-foreground"
        >
          Trạng thái xử lý
        </label>
        <select
          id="contact-detail-status"
          name="status"
          value={selectedStatus}
          disabled={pending}
          onChange={(event) => {
            setSelectedStatus(event.target.value as ContactSubmissionStatus);
            setHasEditedSinceLastSubmit(true);
          }}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {CONTACT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {showFeedback && state.status === "success" && state.message ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-sm text-primary-dark"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}

        {showFeedback && isError && state.message ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <StatusSubmitButton isUnchanged={selectedStatus === currentStatus} />
        {selectedStatus === currentStatus ? (
          <p className="text-xs text-muted-foreground">
            Chọn trạng thái khác để lưu thay đổi.
          </p>
        ) : null}
      </div>
    </>
  );
}

export function ContactStatusForm({
  submissionId,
  currentStatus,
}: ContactStatusFormProps) {
  const [state, formAction] = useFormState(
    updateContactSubmissionStatusAction,
    initialState
  );

  return (
    <form
      action={formAction}
      aria-label="Cập nhật trạng thái xử lý yêu cầu tư vấn"
      className="space-y-4"
    >
      <input type="hidden" name="id" value={submissionId} />
      <StatusFormFields currentStatus={currentStatus} state={state} />
    </form>
  );
}


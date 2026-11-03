"use client";

import { useState, useTransition, type FormEvent } from "react";

import { submitReport } from "@/app/(app)/report/actions";
import { CheckIcon, SendIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { REPORT_CATEGORIES, REPORT_MAX_LENGTH } from "@/lib/validation";

type FieldErrors = {
  category?: string;
  description?: string;
};

export function ReportForm() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const selected = REPORT_CATEGORIES.find((item) => item.value === category);
  const remaining = REPORT_MAX_LENGTH - description.length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};

    if (!category) errors.category = "Pick the kind of problem.";
    if (!description.trim()) {
      errors.description = "Describe what happened — it can't be blank.";
    } else if (description.trim().length > REPORT_MAX_LENGTH) {
      errors.description = `Please keep it under ${REPORT_MAX_LENGTH} characters.`;
    }

    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const result = await submitReport({ category, description });

      if (!result.ok) {
        setFormError(result.message);
        toast({ message: result.message, tone: "error" });
        return;
      }

      setCategory("");
      setDescription("");
      setFieldErrors({});
      setSent(true);
      toast({
        message: "Report sent — the mess admin can see it now.",
        tone: "success",
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200 sm:p-6"
    >
      <div>
        <h2 className="text-lg font-extrabold text-cocoa-900">New report</h2>
        <p className="mt-0.5 text-sm font-medium text-cocoa-500">
          Takes about 20 seconds. The admin sees it straight away.
        </p>
      </div>

      <Select
        id="report-category"
        label="Category"
        value={category}
        onChange={(event) => {
          setCategory(event.target.value);
          if (fieldErrors.category) {
            setFieldErrors((current) => ({ ...current, category: undefined }));
          }
        }}
        error={fieldErrors.category}
        hint={
          <p className="text-xs text-cocoa-400">
            {selected?.hint ?? "Pick what best describes the problem."}
          </p>
        }
      >
        <option value="">Select a category…</option>
        {REPORT_CATEGORIES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Textarea
        id="report-description"
        label="What happened?"
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          setSent(false);
          if (fieldErrors.description) {
            setFieldErrors((current) => ({ ...current, description: undefined }));
          }
        }}
        rows={4}
        maxLength={REPORT_MAX_LENGTH}
        placeholder="Dinner was served 40 minutes late and the rotis were cold…"
        error={fieldErrors.description}
        footer={
          <p
            className={`text-right text-xs font-semibold ${
              remaining <= 50 ? "text-brand-600" : "text-cocoa-400"
            }`}
          >
            {description.length}/{REPORT_MAX_LENGTH}
          </p>
        }
      />

      {formError ? (
        <p
          role="alert"
          className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-[#8f1f17]"
        >
          {formError}
        </p>
      ) : null}

      {sent ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-semibold text-[#1f5a33]"
        >
          <CheckIcon className="mt-0.5 size-5 shrink-0" />
          <p>
            Report sent. Track its status under <strong>Your reports</strong> below.
          </p>
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <span
              aria-hidden
              className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Sending…
          </>
        ) : (
          <>
            <SendIcon className="size-5" />
            Send report
          </>
        )}
      </Button>
    </form>
  );
}

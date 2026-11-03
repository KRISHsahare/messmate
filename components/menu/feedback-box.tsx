"use client";

import { useState, useTransition, type FormEvent } from "react";

import { submitFeedback } from "@/app/(app)/menu/actions";
import { ChatIcon, SendIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { FEEDBACK_MAX_LENGTH } from "@/lib/validation";

type FeedbackBoxProps = {
  menuId: string;
  mealLabel: string;
};

/**
 * Collapsed-by-default comment box so the menu cards stay short. The counter,
 * trimming and length limit are mirrored on the server.
 */
export function FeedbackBox({ menuId, mealLabel }: FeedbackBoxProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const remaining = FEEDBACK_MAX_LENGTH - comment.length;
  const tooLong = comment.length > FEEDBACK_MAX_LENGTH;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!comment.trim()) {
      setError("Write a few words before sending.");
      return;
    }
    if (tooLong) {
      setError(`Please keep it under ${FEEDBACK_MAX_LENGTH} characters.`);
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await submitFeedback({ menuId, comment });

      if (!result.ok) {
        setError(result.message);
        toast({ message: result.message, tone: "error" });
        return;
      }

      setComment("");
      setOpen(false);
      setSent(true);
      toast({
        message: `Feedback sent for ${mealLabel.toLowerCase()}.`,
        tone: "success",
        durationMs: 3000,
      });
    });
  }

  if (!open) {
    return (
      <div className="space-y-1.5">
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true);
            setSent(false);
          }}
          className="w-full"
        >
          <ChatIcon className="size-5" />
          Write feedback
        </Button>
        {sent ? (
          <p className="text-center text-xs font-semibold text-leaf-700">
            Sent — thanks for telling us.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        id={`feedback-${menuId}`}
        label={`Feedback for ${mealLabel.toLowerCase()}`}
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
          if (error) setError(null);
        }}
        rows={3}
        maxLength={FEEDBACK_MAX_LENGTH}
        placeholder="Too salty? Loved the paneer? Tell the mess team…"
        error={error}
        footer={
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-semibold ${
                remaining <= 50 ? "text-brand-600" : "text-cocoa-400"
              }`}
            >
              {comment.length}/{FEEDBACK_MAX_LENGTH}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setComment("");
                setError(null);
              }}
              className="rounded-full px-2 text-xs font-bold text-cocoa-500 underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>
        }
      />

      <Button type="submit" size="md" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <span
              aria-hidden
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Sending…
          </>
        ) : (
          <>
            <SendIcon className="size-4" />
            Send feedback
          </>
        )}
      </Button>
    </form>
  );
}

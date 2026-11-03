import Link from "next/link";

import { FeedbackHistory } from "@/components/feedback/feedback-history";
import { ChatIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { listMyFeedback } from "@/lib/data/feedback";

export const metadata = { title: "My feedback" };

export default async function MyFeedbackPage() {
  const result = await listMyFeedback();

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Your history"
        title="My feedback"
        description="Every comment you've sent, newest first — linked to the meal it describes."
      />

      {result.status === "error" ? (
        <EmptyState
          icon={<ChatIcon className="size-6" />}
          title="We couldn't load your feedback"
          description={result.message}
          action={
            <Link
              href="/my-feedback"
              className={buttonStyles({ variant: "secondary" })}
            >
              Try again
            </Link>
          }
        />
      ) : result.entries.length === 0 ? (
        <EmptyState
          icon={<ChatIcon className="size-6" />}
          title="No feedback yet"
          description="When you rate a meal and leave a note, it shows up here so you can see what you said."
          action={
            <Link href="/menu" className={buttonStyles()}>
              See today&apos;s menu
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm font-bold text-cocoa-500">
            {result.entries.length}{" "}
            {result.entries.length === 1 ? "comment" : "comments"}
          </p>
          <FeedbackHistory entries={result.entries} />
        </>
      )}
    </div>
  );
}

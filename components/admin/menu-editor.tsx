"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { deleteMenu, saveMenu } from "@/app/(app)/admin/actions";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { MenuEditorMeal } from "@/lib/data/admin";
import { MEAL_META } from "@/lib/meals";

function toItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function MealEditor({ date, meal }: { date: string; meal: MenuEditorMeal }) {
  const id = useId();
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState(meal.items.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const meta = MEAL_META[meal.mealType];
  const items = toItems(text);

  const onSave = () => {
    setError(null);

    if (items.length === 0) {
      setError("Add at least one dish — one per line.");
      return;
    }

    startTransition(async () => {
      const result = await saveMenu({ date, mealType: meal.mealType, items });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast({ message: `${meta.label} menu saved.`, tone: "success" });
      router.refresh();
    });
  };

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteMenu({ date, mealType: meal.mealType });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setText("");
      setConfirming(false);
      toast({ message: `${meta.label} removed from this day.`, tone: "success" });
      router.refresh();
    });
  };

  return (
    <section
      className="flex flex-col rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200"
      aria-label={`${meta.label} menu`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-cocoa-900">
            <span aria-hidden>{meta.emoji}</span> {meta.label}
          </h2>
          <p className="text-xs font-semibold text-cocoa-400">{meta.window}</p>
        </div>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-extrabold",
            meal.menuId
              ? "bg-leaf-100 text-leaf-700"
              : "bg-cream-200 text-cocoa-500",
          ].join(" ")}
        >
          {meal.menuId ? "Published" : "Not published"}
        </span>
      </div>

      <div className="mt-3 flex-1">
        <Textarea
          id={`${id}-items`}
          label="Dishes, one per line"
          rows={6}
          value={text}
          error={error}
          onChange={(event) => setText(event.target.value)}
          placeholder={"Poha\nJalebi\nMasala Chai"}
        />
        <p className="mt-1 text-xs font-semibold text-cocoa-400">
          {items.length} {items.length === 1 ? "dish" : "dishes"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={onSave} disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : meal.menuId ? "Update menu" : "Publish menu"}
        </Button>

        {meal.menuId ? (
          confirming ? (
            <>
              <Button variant="danger" onClick={onDelete} disabled={pending}>
                <CheckIcon className="size-4" />
                Confirm delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirming(true)}
              disabled={pending}
            >
              Delete
            </Button>
          )
        ) : null}
      </div>
    </section>
  );
}

export function MenuEditor({
  date,
  meals,
}: {
  date: string;
  meals: MenuEditorMeal[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealEditor key={`${date}-${meal.mealType}`} date={date} meal={meal} />
      ))}
    </div>
  );
}

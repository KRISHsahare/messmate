"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { updateMessPrice } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function MessPriceForm({ price }: { price: number | null }) {
  const id = useId();
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(price === null ? "" : String(price));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateMessPrice({ price: value });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast({ message: "Price per meal updated.", tone: "success" });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-36">
        <Field
          id={`${id}-price`}
          label="Price per meal (₹)"
          type="number"
          min={0}
          max={10000}
          step={1}
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <Button variant="secondary" onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save price"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";

export function MutableToggle() {
  const isMutable = useCalculatorStore((s) => s.inputs.isMutable);
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">
        Is Data Mutable?
      </span>
      <div
        className="flex gap-2"
        role="radiogroup"
        aria-label="Is data mutable"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isMutable}
          onClick={() => setInput("isMutable", false)}
          className={cn(
            "flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors",
            !isMutable
              ? "border-blue-600 bg-blue-50 text-blue-900"
              : "border-border bg-background hover:border-blue-300"
          )}
        >
          No (Immutable)
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isMutable}
          onClick={() => setInput("isMutable", true)}
          className={cn(
            "flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors",
            isMutable
              ? "border-amber-600 bg-amber-50 text-amber-900"
              : "border-border bg-background hover:border-amber-300"
          )}
        >
          Yes (Mutable)
        </button>
      </div>
      {isMutable && (
        <p className="text-xs text-amber-600">
          Frequent overwrites/deletes can trigger minimum duration charges on
          IA and Glacier classes.
        </p>
      )}
    </div>
  );
}

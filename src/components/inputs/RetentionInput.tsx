"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";

export function RetentionInput() {
  const retentionMonths = useCalculatorStore(
    (s) => s.inputs.retentionMonths
  );
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <label
        htmlFor="retention-months"
        className="text-sm font-medium leading-none"
      >
        Expected Retention (Months)
      </label>
      <Input
        id="retention-months"
        type="number"
        min={1}
        step={1}
        placeholder="e.g. 12"
        value={retentionMonths || ""}
        onChange={(e) =>
          setInput("retentionMonths", parseInt(e.target.value, 10) || 0)
        }
        aria-label="Expected data retention period in months"
      />
      <p className="text-xs text-muted-foreground">
        How long data will be stored before deletion
      </p>
    </div>
  );
}

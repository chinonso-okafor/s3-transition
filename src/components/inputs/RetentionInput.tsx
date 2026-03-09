"use client";

import { useState } from "react";
import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { InfoPopover } from "@/components/ui/InfoPopover";

export function RetentionInput() {
  const retentionMonths = useCalculatorStore(
    (s) => s.inputs.retentionMonths
  );
  const setInput = useCalculatorStore((s) => s.setInput);
  const [rawValue, setRawValue] = useState(
    retentionMonths ? String(retentionMonths) : ""
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor="retention-months"
        className="flex items-center gap-1.5 text-sm font-medium leading-none"
      >
        Expected Retention (Months)
        <InfoPopover text="How long you expect to keep objects in this bucket before deletion. This affects the minimum duration penalty calculation for IA and Glacier classes." />
      </label>
      <Input
        id="retention-months"
        type="number"
        min={0}
        step={1}
        placeholder="e.g. 12"
        value={rawValue}
        onChange={(e) => {
          const val = e.target.value;
          setRawValue(val);
          setInput("retentionMonths", val === "" ? 0 : parseInt(val, 10) || 0);
        }}
        aria-label="Expected data retention period in months"
      />
      <p className="text-xs text-muted-foreground">
        How long data will be stored before deletion
      </p>
    </div>
  );
}

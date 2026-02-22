"use client";

import { AccessPatternConfidence } from "@/types";
import { useCalculatorStore } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";

const CONFIDENCE_OPTIONS: {
  value: AccessPatternConfidence;
  label: string;
  description: string;
}[] = [
  {
    value: "low",
    label: "Low",
    description: "Rough estimates or no historical data",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Some data from CloudWatch or Storage Lens",
  },
  {
    value: "high",
    label: "High",
    description: "Verified data from 30+ days of monitoring",
  },
];

export function ConfidenceSelector() {
  const confidence = useCalculatorStore(
    (s) => s.inputs.accessPatternConfidence
  );
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">
        Access Pattern Confidence
      </span>
      <div
        className="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Access pattern confidence level"
      >
        {CONFIDENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={confidence === option.value}
            onClick={() =>
              setInput("accessPatternConfidence", option.value)
            }
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-colors",
              confidence === option.value
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-border bg-background hover:border-blue-300 hover:bg-blue-50/50"
            )}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground leading-tight">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

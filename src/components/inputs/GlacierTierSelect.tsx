"use client";

import { GlacierRetrievalTier } from "@/types";
import { useCalculatorStore } from "@/store/calculatorStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIER_OPTIONS: {
  value: GlacierRetrievalTier;
  label: string;
  description: string;
}[] = [
  {
    value: "expedited",
    label: "Expedited",
    description: "1\u20135 min, highest cost",
  },
  {
    value: "standard",
    label: "Standard",
    description: "3\u20135 hours, moderate cost",
  },
  {
    value: "bulk",
    label: "Bulk",
    description: "5\u201312 hours, lowest cost",
  },
];

export function GlacierTierSelect() {
  const glacierRetrievalTier = useCalculatorStore(
    (s) => s.inputs.glacierRetrievalTier
  );
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <label
        htmlFor="glacier-tier"
        className="text-sm font-medium leading-none"
      >
        Glacier Retrieval Tier
      </label>
      <Select
        value={glacierRetrievalTier}
        onValueChange={(value) =>
          setInput("glacierRetrievalTier", value as GlacierRetrievalTier)
        }
      >
        <SelectTrigger id="glacier-tier" aria-label="Glacier retrieval tier">
          <SelectValue placeholder="Select retrieval tier" />
        </SelectTrigger>
        <SelectContent>
          {TIER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label} — {option.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Retrieval speed affects cost for Glacier Flexible and Deep Archive
      </p>
    </div>
  );
}

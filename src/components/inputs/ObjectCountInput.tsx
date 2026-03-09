"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { calcAvgObjectSizeKB } from "@/lib/calculator";
import { parseIntFromInput } from "@/lib/utils";

function formatSize(kb: number): string {
  if (kb >= 1_048_576) return `${(kb / 1_048_576).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

export function ObjectCountInput() {
  const objectCount = useCalculatorStore((s) => s.inputs.objectCount);
  const storageGB = useCalculatorStore((s) => s.inputs.storageGB);
  const setInput = useCalculatorStore((s) => s.setInput);

  const avgObjectSizeKB =
    storageGB > 0 && objectCount > 0
      ? calcAvgObjectSizeKB(storageGB, objectCount)
      : null;

  return (
    <div className="space-y-2">
      <label
        htmlFor="object-count"
        className="flex items-center gap-1.5 text-sm font-medium leading-none"
      >
        Object Count
        <InfoPopover text="The number of individual objects stored in this bucket. Object count affects minimum billing thresholds, Intelligent-Tiering monitoring fees, and transition costs." />
      </label>
      <Input
        id="object-count"
        type="text"
        inputMode="numeric"
        placeholder="e.g. 1000000"
        value={objectCount || ""}
        onChange={(e) =>
          setInput("objectCount", parseIntFromInput(e.target.value))
        }
        aria-label="Total number of objects"
      />
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Average Object Size
          <InfoPopover text="Calculated from your storage volume and object count. Objects below 128 KB are billed as 128 KB in IA and Glacier classes, which can significantly inflate your effective cost." />
        </span>
        {avgObjectSizeKB !== null && (
          <Badge
            variant={avgObjectSizeKB < 128 ? "destructive" : "secondary"}
            aria-label={`Average object size: ${formatSize(avgObjectSizeKB)}`}
          >
            Avg: {formatSize(avgObjectSizeKB)}
          </Badge>
        )}
      </div>
    </div>
  );
}

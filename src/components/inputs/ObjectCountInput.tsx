"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calcAvgObjectSizeKB } from "@/lib/calculator";

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
        className="text-sm font-medium leading-none"
      >
        Object Count
      </label>
      <Input
        id="object-count"
        type="number"
        min={0}
        step={1}
        placeholder="e.g. 1000000"
        value={objectCount || ""}
        onChange={(e) =>
          setInput("objectCount", parseInt(e.target.value, 10) || 0)
        }
        aria-label="Total number of objects"
      />
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Total number of objects</p>
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

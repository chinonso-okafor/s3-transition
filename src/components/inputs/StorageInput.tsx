"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { InfoPopover } from "@/components/ui/InfoPopover";

export function StorageInput() {
  const storageGB = useCalculatorStore((s) => s.inputs.storageGB);
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <label
        htmlFor="storage-gb"
        className="flex items-center gap-1.5 text-sm font-medium leading-none"
      >
        Total Storage (GB)
        <InfoPopover text="The total volume of data currently stored in this bucket, in gigabytes. Include all object versions if versioning is enabled." />
      </label>
      <Input
        id="storage-gb"
        type="number"
        min={0}
        step={1}
        placeholder="e.g. 10000"
        value={storageGB || ""}
        onChange={(e) =>
          setInput("storageGB", parseFloat(e.target.value) || 0)
        }
        aria-label="Total storage in gigabytes"
      />
      <p className="text-xs text-muted-foreground">
        Total data volume stored in this bucket
      </p>
    </div>
  );
}

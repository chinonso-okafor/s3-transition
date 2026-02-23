"use client";

import { AWSRegion } from "@/types";
import { REGION_LABELS, REGION_GROUPS } from "@/lib/pricing";
import { useCalculatorStore } from "@/store/calculatorStore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegionSelect() {
  const region = useCalculatorStore((s) => s.inputs.region);
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <label
        htmlFor="region-select"
        className="text-sm font-medium leading-none"
      >
        AWS Region
      </label>
      <Select
        value={region}
        onValueChange={(value) => setInput("region", value as AWSRegion)}
      >
        <SelectTrigger id="region-select" aria-label="AWS Region">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          {REGION_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SelectLabel>
              {group.regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {REGION_LABELS[r]}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

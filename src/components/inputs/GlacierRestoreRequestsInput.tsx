"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { InfoPopover } from "@/components/ui/InfoPopover";

export function GlacierRestoreRequestsInput() {
  const monthlyRestoreRequests = useCalculatorStore(
    (s) => s.inputs.monthlyRestoreRequests
  );
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-2">
      <label
        htmlFor="monthly-restore-requests"
        className="flex items-center gap-1.5 text-sm font-medium leading-none"
      >
        Monthly Glacier Restore Requests
        <InfoPopover text="Glacier Flexible and Deep Archive require a restore request before objects can be accessed. This is separate from your monthly GET requests — a typical archival workload has hundreds to thousands of restore requests per month, not millions. Leaving this blank uses your GET request count as a proxy, which may overstate Glacier retrieval costs for high-GET buckets." />
      </label>
      <Input
        id="monthly-restore-requests"
        type="number"
        min={0}
        step={100}
        placeholder="e.g. 500"
        value={monthlyRestoreRequests || ""}
        onChange={(e) =>
          setInput(
            "monthlyRestoreRequests",
            parseInt(e.target.value, 10) || 0
          )
        }
        aria-label="Monthly Glacier restore requests"
      />
      <p className="text-xs text-muted-foreground">
        Number of restore requests per month if transitioning to Glacier
        Flexible or Deep Archive. If your bucket is already on Glacier, find
        this in CloudWatch → S3 → RestoreRequests. If not yet on Glacier,
        estimate based on how often your application would need to access
        archived objects.
      </p>
    </div>
  );
}

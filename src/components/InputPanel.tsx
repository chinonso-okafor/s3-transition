"use client";

import { StorageClass } from "@/types";
import { STORAGE_CLASS_LABELS, EOZ_REGIONS } from "@/lib/pricing";
import { useCalculatorStore } from "@/store/calculatorStore";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegionSelect } from "@/components/inputs/RegionSelect";
import { StorageInput } from "@/components/inputs/StorageInput";
import { ObjectCountInput } from "@/components/inputs/ObjectCountInput";
import { AccessPatternInputs } from "@/components/inputs/AccessPatternInputs";
import { ConfidenceSelector } from "@/components/inputs/ConfidenceSelector";
import { RetentionInput } from "@/components/inputs/RetentionInput";
import { MutableToggle } from "@/components/inputs/MutableToggle";
import { GlacierTierSelect } from "@/components/inputs/GlacierTierSelect";
import { MixedSegmentTable } from "@/components/inputs/MixedSegmentTable";
import { Button } from "@/components/ui/button";
import { InfoPopover } from "@/components/ui/InfoPopover";

const SINGLE_MODE_CLASSES = [
  StorageClass.EXPRESS_ONE_ZONE,
  StorageClass.STANDARD,
  StorageClass.INTELLIGENT_TIERING,
  StorageClass.STANDARD_IA,
  StorageClass.ONE_ZONE_IA,
  StorageClass.GLACIER_INSTANT,
  StorageClass.GLACIER_FLEXIBLE,
  StorageClass.GLACIER_DEEP_ARCHIVE,
  StorageClass.REDUCED_REDUNDANCY,
];

export function InputPanel() {
  const currentClass = useCalculatorStore((s) => s.inputs.currentClass);
  const region = useCalculatorStore((s) => s.inputs.region);
  const bucketMode = useCalculatorStore((s) => s.inputs.bucketMode);
  const itArchiveTiersEnabled = useCalculatorStore(
    (s) => s.inputs.itArchiveTiersEnabled
  );
  const setInput = useCalculatorStore((s) => s.setInput);
  const setBucketMode = useCalculatorStore((s) => s.setBucketMode);
  const output = useCalculatorStore((s) => s.output);

  const currentClassResult = output?.results.find(
    (r) => r.storageClass === currentClass
  );
  const currentMonthlyCost =
    bucketMode === "single" ? (currentClassResult?.monthlyCost.total ?? null) : null;

  const showGlacierOptions = output !== null;

  // Only show EOZ in dropdown if region supports it
  const isEOZRegion = EOZ_REGIONS.includes(region);
  const selectableClasses = SINGLE_MODE_CLASSES.filter(
    (sc) => sc !== StorageClass.EXPRESS_ONE_ZONE || isEOZRegion
  );

  // Show IT archive tiers toggle when IT is current class or a viable target
  const itIsRelevant =
    currentClass === StorageClass.INTELLIGENT_TIERING ||
    (output?.results.some(
      (r) => r.storageClass === StorageClass.INTELLIGENT_TIERING && r.isEligible
    ) ??
      false);

  return (
    <aside className="w-full lg:w-[400px] lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-border lg:overflow-y-auto">
      <div className="divide-y divide-border">
        {/* Bucket Mode Toggle */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Bucket Mode
          </h3>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBucketMode("single")}
              className={`flex-1 rounded-none text-sm font-medium transition-colors ${
                bucketMode === "single"
                  ? "bg-[#2563eb] text-white hover:bg-[#2563eb] hover:text-white"
                  : "bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              Single Storage Class
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBucketMode("mixed")}
              className={`flex-1 rounded-none text-sm font-medium transition-colors ${
                bucketMode === "mixed"
                  ? "bg-[#2563eb] text-white hover:bg-[#2563eb] hover:text-white"
                  : "bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              Mixed Storage Classes
            </Button>
          </div>
        </section>

        {/* Section 1: Workload Profile */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Workload Profile
          </h3>
          <div className="space-y-4">
            <RegionSelect />
            {bucketMode === "single" && <StorageInput />}
            <ObjectCountInput />
          </div>
        </section>

        {/* Section 2: Access Patterns */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Access Patterns
          </h3>
          <div className="space-y-4">
            <AccessPatternInputs />
            <ConfidenceSelector />
          </div>
        </section>

        {/* Section 3: Current Setup / Mixed Segments */}
        <section className="px-6 py-5">
          {bucketMode === "single" ? (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Current Setup
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="current-class"
                    className="flex items-center gap-1.5 text-sm font-medium leading-none text-foreground"
                  >
                    Current Storage Class
                    <InfoPopover text="The storage class your objects are currently in. If your bucket contains objects in multiple classes, select Mixed Storage Classes at the top of the panel." />
                  </label>
                  <Select
                    value={currentClass}
                    onValueChange={(value) =>
                      setInput("currentClass", value as StorageClass)
                    }
                  >
                    <SelectTrigger
                      id="current-class"
                      aria-label="Current storage class"
                    >
                      <SelectValue placeholder="Select current class" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableClasses.map((sc) => (
                        <SelectItem key={sc} value={sc}>
                          {STORAGE_CLASS_LABELS[sc]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* RRS deprecation amber notice */}
                {currentClass === StorageClass.REDUCED_REDUNDANCY && (
                  <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 border-l-4 border-l-[#d97706]">
                    <p className="text-sm text-[#92400e]">
                      Reduced Redundancy Storage is deprecated by AWS. It offers
                      lower durability than Standard at similar cost. This tool
                      will include a migration recommendation in the results.
                    </p>
                  </div>
                )}
                {currentMonthlyCost !== null && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      Current estimated monthly cost
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(currentMonthlyCost)}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <MixedSegmentTable />
          )}
        </section>

        {/* Section 4: Retention & Behavior */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Retention & Behavior
          </h3>
          <div className="space-y-4">
            <RetentionInput />
            <MutableToggle />
          </div>
        </section>

        {/* Section 5: Glacier Options (conditional) */}
        {showGlacierOptions && (
          <section className="px-6 py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Glacier Options
            </h3>
            <div className="space-y-4">
              <GlacierTierSelect />
            </div>
          </section>
        )}

        {/* Section 6: IT Archive Tiers (conditional) */}
        {itIsRelevant && (
          <section className="px-6 py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Intelligent-Tiering Options
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="it-archive-tiers"
                    className="flex items-center gap-1.5 text-sm font-medium leading-none text-foreground"
                  >
                    Archive Access tiers enabled
                    <InfoPopover text="Whether your Intelligent-Tiering bucket has the optional Archive Access and Deep Archive Access tiers activated. These reduce storage costs further but require asynchronous restore requests." />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable if your IT bucket is configured with optional Archive
                    and Deep Archive Access tiers.
                  </p>
                </div>
              </div>
              <div
                className="flex gap-2"
                role="radiogroup"
                aria-label="Archive Access tiers"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!itArchiveTiersEnabled}
                  onClick={() => setInput("itArchiveTiersEnabled", false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    !itArchiveTiersEnabled
                      ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                      : "border-border bg-white text-muted-foreground hover:bg-[#f9fafb]"
                  }`}
                >
                  Disabled
                </button>
                <button
                  type="button"
                  id="it-archive-tiers"
                  role="radio"
                  aria-checked={itArchiveTiersEnabled}
                  onClick={() => setInput("itArchiveTiersEnabled", true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    itArchiveTiersEnabled
                      ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                      : "border-border bg-white text-muted-foreground hover:bg-[#f9fafb]"
                  }`}
                >
                  Enabled
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

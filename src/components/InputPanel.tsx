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

const ALL_CLASSES = Object.values(StorageClass);

export function InputPanel() {
  const currentClass = useCalculatorStore((s) => s.inputs.currentClass);
  const region = useCalculatorStore((s) => s.inputs.region);
  const itArchiveTiersEnabled = useCalculatorStore(
    (s) => s.inputs.itArchiveTiersEnabled
  );
  const setInput = useCalculatorStore((s) => s.setInput);
  const output = useCalculatorStore((s) => s.output);

  const currentClassResult = output?.results.find(
    (r) => r.storageClass === currentClass
  );
  const currentMonthlyCost = currentClassResult?.monthlyCost.total ?? null;

  const showGlacierOptions = output !== null;

  // Only show EOZ in dropdown if region supports it
  const isEOZRegion = EOZ_REGIONS.includes(region);
  const selectableClasses = ALL_CLASSES.filter(
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
        {/* Section 1: Workload Profile */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Workload Profile
          </h3>
          <div className="space-y-4">
            <RegionSelect />
            <StorageInput />
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

        {/* Section 3: Current Setup */}
        <section className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Current Setup
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="current-class"
                className="text-sm font-medium leading-none text-foreground"
              >
                Current Storage Class
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
                    className="text-sm font-medium leading-none text-foreground"
                  >
                    Archive Access tiers enabled
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

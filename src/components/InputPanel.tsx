"use client";

import { StorageClass } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { useCalculatorStore } from "@/store/calculatorStore";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RegionSelect } from "@/components/inputs/RegionSelect";
import { StorageInput } from "@/components/inputs/StorageInput";
import { ObjectCountInput } from "@/components/inputs/ObjectCountInput";
import { AccessPatternInputs } from "@/components/inputs/AccessPatternInputs";
import { ConfidenceSelector } from "@/components/inputs/ConfidenceSelector";
import { RetentionInput } from "@/components/inputs/RetentionInput";
import { MutableToggle } from "@/components/inputs/MutableToggle";
import { GlacierTierSelect } from "@/components/inputs/GlacierTierSelect";

const SELECTABLE_CLASSES = Object.values(StorageClass).filter(
  (sc) => sc !== StorageClass.EXPRESS_ONE_ZONE
);

export function InputPanel() {
  const currentClass = useCalculatorStore((s) => s.inputs.currentClass);
  const setInput = useCalculatorStore((s) => s.setInput);
  const output = useCalculatorStore((s) => s.output);

  const currentClassResult = output?.results.find(
    (r) => r.storageClass === currentClass
  );
  const currentMonthlyCost = currentClassResult?.monthlyCost.total ?? null;

  const showGlacierOptions = output !== null;

  return (
    <div className="w-full lg:w-[400px] lg:shrink-0 space-y-4">
      {/* Section 1: Workload Profile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Workload Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegionSelect />
          <StorageInput />
          <ObjectCountInput />
        </CardContent>
      </Card>

      {/* Section 2: Access Patterns */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Access Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AccessPatternInputs />
          <ConfidenceSelector />
        </CardContent>
      </Card>

      {/* Section 3: Current Setup */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Current Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="current-class"
              className="text-sm font-medium leading-none"
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
                {SELECTABLE_CLASSES.map((sc) => (
                  <SelectItem key={sc} value={sc}>
                    {STORAGE_CLASS_LABELS[sc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentMonthlyCost !== null && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Current estimated monthly cost
              </span>
              <Badge variant="outline" className="text-base font-semibold">
                {formatCurrency(currentMonthlyCost)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Retention & Behavior */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Retention & Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RetentionInput />
          <MutableToggle />
        </CardContent>
      </Card>

      {/* Section 5: Glacier Options (conditional) */}
      {showGlacierOptions && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Glacier Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GlacierTierSelect />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

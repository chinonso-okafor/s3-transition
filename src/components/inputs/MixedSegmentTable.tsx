"use client";

import { StorageClass } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { parseFloatFromInput } from "@/lib/utils";

const MIXED_SELECTABLE_CLASSES = [
  StorageClass.STANDARD,
  StorageClass.INTELLIGENT_TIERING,
  StorageClass.STANDARD_IA,
  StorageClass.ONE_ZONE_IA,
  StorageClass.GLACIER_INSTANT,
  StorageClass.GLACIER_FLEXIBLE,
  StorageClass.GLACIER_DEEP_ARCHIVE,
  StorageClass.REDUCED_REDUNDANCY,
];

export function MixedSegmentTable() {
  const mixedSegments = useCalculatorStore((s) => s.inputs.mixedSegments);
  const objectCount = useCalculatorStore((s) => s.inputs.objectCount);
  const addMixedSegment = useCalculatorStore((s) => s.addMixedSegment);
  const updateMixedSegment = useCalculatorStore((s) => s.updateMixedSegment);
  const removeMixedSegment = useCalculatorStore((s) => s.removeMixedSegment);

  const totalStorageGB = mixedSegments.reduce(
    (sum, s) => sum + (s.storageGB || 0),
    0
  );
  const uniqueClasses = new Set(
    mixedSegments.filter((s) => s.storageGB > 0).map((s) => s.storageClass)
  );
  const avgObjectSizeKB =
    totalStorageGB > 0 && objectCount > 0
      ? (totalStorageGB * 1_048_576) / objectCount
      : 0;

  const validSegments = mixedSegments.filter((s) => s.storageGB > 0);
  const hasInvalidGB = mixedSegments.some(
    (s) => s.storageGB === 0 || !s.storageGB
  );

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
        Storage Class Distribution
        <InfoPopover text="The GB of data currently stored in each storage class within this bucket. Distribute your total storage across each class as shown in S3 Storage Lens or your cost tooling." />
      </h3>
      <div className="space-y-2">
        {mixedSegments.map((segment) => {
          const pct =
            totalStorageGB > 0
              ? ((segment.storageGB || 0) / totalStorageGB) * 100
              : 0;
          return (
            <div
              key={segment.id}
              className="flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <Select
                  value={segment.storageClass}
                  onValueChange={(value) =>
                    updateMixedSegment(segment.id, {
                      storageClass: value as StorageClass,
                    })
                  }
                >
                  <SelectTrigger
                    className="text-sm"
                    aria-label={`Storage class for segment ${segment.id}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MIXED_SELECTABLE_CLASSES.map((sc) => (
                      <SelectItem key={sc} value={sc}>
                        {STORAGE_CLASS_LABELS[sc]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 shrink-0">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={segment.storageGB || ""}
                  onChange={(e) =>
                    updateMixedSegment(segment.id, {
                      storageGB: parseFloatFromInput(e.target.value),
                    })
                  }
                  aria-label={`Storage GB for segment ${segment.id}`}
                  className="text-sm tabular-nums"
                />
              </div>
              <span className="w-12 text-right text-xs text-[#6b7280] tabular-nums shrink-0">
                {pct > 0 ? `${pct.toFixed(0)}%` : "—"}
              </span>
              <button
                type="button"
                disabled={mixedSegments.length <= 2}
                onClick={() => removeMixedSegment(segment.id)}
                className="shrink-0 p-1 rounded text-[#6b7280] hover:text-[#dc2626] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label={`Remove segment ${segment.id}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMixedSegment}
        className="w-full text-sm"
      >
        + Add Storage Class
      </Button>

      <div className="space-y-1 pt-1">
        <p className="text-[13px] text-[#6b7280]">
          Total storage:{" "}
          <span className="font-medium">
            {totalStorageGB >= 1000
              ? `${(totalStorageGB / 1000).toFixed(1)} TB`
              : `${totalStorageGB.toFixed(1)} GB`}
          </span>{" "}
          across {uniqueClasses.size} storage class
          {uniqueClasses.size !== 1 ? "es" : ""}
        </p>
        {avgObjectSizeKB > 0 && (
          <p className="text-[13px] text-[#6b7280]">
            Avg object size:{" "}
            <span className="font-medium">
              {avgObjectSizeKB >= 1024
                ? `${(avgObjectSizeKB / 1024).toFixed(1)} MB`
                : `${avgObjectSizeKB.toFixed(1)} KB`}
            </span>
          </p>
        )}
      </div>

      {/* Validation messages */}
      {mixedSegments.length < 2 && (
        <p className="text-sm text-[#9ca3af]">
          Add at least two storage classes to compare
        </p>
      )}
      {mixedSegments.length >= 2 && hasInvalidGB && validSegments.length < 2 && (
        <p className="text-sm text-[#dc2626]">
          Enter storage GB for all classes
        </p>
      )}
    </div>
  );
}

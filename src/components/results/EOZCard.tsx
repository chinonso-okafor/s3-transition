"use client";

import { CalculatorOutput, StorageClass } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { REGION_LABELS } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EOZCardProps {
  output: CalculatorOutput;
}

export function EOZCard({ output }: EOZCardProps) {
  const { eozResult, inputs } = output;

  // Suppress EOZ in mixed mode
  if (inputs.bucketMode === "mixed") return null;

  if (!eozResult || inputs.currentClass !== StorageClass.STANDARD) return null;

  if (!eozResult.isEligible) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            High-Performance Tier: S3 Express One Zone
          </h2>
          <p className="text-sm text-[#6b7280]">
            Not available in {REGION_LABELS[inputs.region]}. S3 Express One Zone
            is only available in select regions. Consider switching to a
            supported region if single-digit millisecond latency is required.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTCO =
    output.results.find((r) => r.storageClass === inputs.currentClass)
      ?.monthlyCost.total ?? 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold text-foreground">
            High-Performance Tier: S3 Express One Zone
          </h2>
          <Badge className="bg-blue-100 text-blue-800 border-0">
            Performance
          </Badge>
        </div>
        <p className="text-sm text-[#6b7280] mb-4">
          Optimized for single-digit millisecond latency with directory buckets
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-[#f9fafb] p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Storage
            </div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {formatCurrency(eozResult.monthlyCost.storage)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-[#f9fafb] p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Upload
            </div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {formatCurrency(eozResult.monthlyCost.upload)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-[#f9fafb] p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Retrieval
            </div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {formatCurrency(eozResult.monthlyCost.retrieval)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-[#f9fafb] p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Requests
            </div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {formatCurrency(eozResult.monthlyCost.requests)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-[#f9fafb] px-4 py-3 mt-4">
          <span className="text-sm font-medium">Total Monthly Cost</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(eozResult.monthlyCost.total)}
          </span>
        </div>

        {eozResult.premiumOverStandard > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mt-4 text-sm text-blue-900">
            EOZ costs{" "}
            <span className="font-semibold">
              {formatCurrency(eozResult.premiumOverStandard)}
            </span>{" "}
            more per month than Standard ({formatCurrency(currentTCO)}/mo).
            This is justified when compute savings from reduced latency exceed
            this premium.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

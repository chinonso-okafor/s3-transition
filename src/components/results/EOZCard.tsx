"use client";

import { CalculatorOutput, StorageClass } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { REGION_LABELS } from "@/lib/pricing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EOZCardProps {
  output: CalculatorOutput;
}

export function EOZCard({ output }: EOZCardProps) {
  const { eozResult, inputs } = output;

  if (!eozResult || inputs.currentClass !== StorageClass.STANDARD) return null;

  if (!eozResult.isEligible) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            High-Performance Tier: S3 Express One Zone
          </CardTitle>
          <CardDescription>
            Not available in {REGION_LABELS[inputs.region]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            S3 Express One Zone is only available in select regions. Consider
            switching to a supported region if single-digit millisecond latency
            is required.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTCO = output.results.find(
    (r) => r.storageClass === inputs.currentClass
  )?.monthlyCost.total ?? 0;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">
            High-Performance Tier: S3 Express One Zone
          </CardTitle>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Performance
          </Badge>
        </div>
        <CardDescription>
          Optimized for single-digit millisecond latency with directory buckets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground">Storage</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatCurrency(eozResult.monthlyCost.storage)}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground">Upload</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatCurrency(eozResult.monthlyCost.upload)}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground">Retrieval</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatCurrency(eozResult.monthlyCost.retrieval)}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground">Requests</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatCurrency(eozResult.monthlyCost.requests)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
          <span className="text-sm font-medium">Total Monthly Cost</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(eozResult.monthlyCost.total)}
          </span>
        </div>

        {eozResult.premiumOverStandard > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            EOZ costs{" "}
            <span className="font-semibold">
              {formatCurrency(eozResult.premiumOverStandard)}
            </span>{" "}
            more per month than Standard ({formatCurrency(currentTCO)}/mo). This is
            justified when compute savings from reduced latency exceed this
            premium.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

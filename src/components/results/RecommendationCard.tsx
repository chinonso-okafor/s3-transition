"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
  output: CalculatorOutput;
}

export function RecommendationCard({ output }: RecommendationCardProps) {
  const { recommendation, confidenceLevel, inputs } = output;

  if (!recommendation || recommendation.monthlySavings <= 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recommendation</CardTitle>
            <Badge variant="destructive">Stay</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {STORAGE_CLASS_LABELS[inputs.currentClass]} is already your most
            cost-effective option for this workload. No transition recommended.
          </p>
        </CardContent>
      </Card>
    );
  }

  const savingsPercent =
    output.results.find((r) => r.storageClass === inputs.currentClass)
      ?.monthlyCost.total ?? 0;
  const savingsPercentValue =
    savingsPercent > 0
      ? ((recommendation.monthlySavings / savingsPercent) * 100).toFixed(0)
      : "0";

  const isStrong =
    confidenceLevel === "high" && recommendation.breakEvenMonths !== null && recommendation.breakEvenMonths < 6;
  const isMarginal =
    confidenceLevel === "low" ||
    (recommendation.breakEvenMonths !== null && recommendation.breakEvenMonths > 12);

  const borderColor = isMarginal
    ? "border-amber-200"
    : isStrong
      ? "border-green-200"
      : "border-green-200";
  const bgColor = isMarginal
    ? "bg-amber-50"
    : isStrong
      ? "bg-green-50"
      : "bg-green-50";
  const badgeClass = isMarginal
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-green-100 text-green-800 border-green-300";

  const confidenceBadge = {
    high: { label: "High Confidence", className: "bg-green-100 text-green-800 border-green-300" },
    medium: { label: "Medium Confidence", className: "bg-amber-100 text-amber-800 border-amber-300" },
    low: { label: "Low Confidence", className: "bg-red-100 text-red-800 border-red-300" },
  }[confidenceLevel];

  let rationale: string;
  if (recommendation.breakEvenMonths !== null && recommendation.breakEvenMonths > 0) {
    rationale = `Transition to ${STORAGE_CLASS_LABELS[recommendation.storageClass]} saves ${formatCurrency(recommendation.monthlySavings)}/mo (${savingsPercentValue}%) with a ${recommendation.breakEvenMonths.toFixed(1)}-month payback period.`;
  } else {
    rationale = `Transition to ${STORAGE_CLASS_LABELS[recommendation.storageClass]} saves ${formatCurrency(recommendation.monthlySavings)}/mo (${savingsPercentValue}%) with immediate savings — no transition costs.`;
  }

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Recommendation</CardTitle>
          <Badge variant="outline" className={confidenceBadge.className}>
            {confidenceBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-foreground">
            {STORAGE_CLASS_LABELS[recommendation.storageClass]}
          </span>
          <div className="flex items-baseline gap-3">
            <span className={`text-xl font-semibold ${isMarginal ? "text-amber-700" : "text-green-700"}`}>
              {formatCurrency(recommendation.monthlySavings)}/mo savings
            </span>
            <Badge variant="outline" className={badgeClass}>
              -{savingsPercentValue}%
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{rationale}</p>
      </CardContent>
    </Card>
  );
}

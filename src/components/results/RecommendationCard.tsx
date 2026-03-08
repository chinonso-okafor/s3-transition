"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoPopover } from "@/components/ui/InfoPopover";

interface RecommendationCardProps {
  output: CalculatorOutput;
}

export function RecommendationCard({ output }: RecommendationCardProps) {
  const { recommendation, confidenceLevel, inputs } = output;

  if (!recommendation || recommendation.monthlySavings <= 0) {
    return (
      <Card className="border-l-4 border-l-[#dc2626]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
              Recommendation
              <InfoPopover text="The storage class with the lowest total cost of ownership for your workload, after modeling storage, request, retrieval, and monitoring costs together." />
            </h2>
            <Badge className="bg-red-100 text-red-800 border-0">Stay</Badge>
          </div>
          <p className="text-sm text-[#6b7280]">
            {STORAGE_CLASS_LABELS[inputs.currentClass]} is already your most
            cost-effective option for this workload. No transition recommended.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTCO =
    output.results.find((r) => r.storageClass === inputs.currentClass)
      ?.monthlyCost.total ?? 0;
  const savingsPercentValue =
    currentTCO > 0
      ? ((recommendation.monthlySavings / currentTCO) * 100).toFixed(0)
      : "0";

  const isMarginal =
    confidenceLevel === "low" ||
    (recommendation.breakEvenMonths !== null &&
      recommendation.breakEvenMonths > 12);

  const borderColor = isMarginal
    ? "border-l-[#d97706]"
    : "border-l-[#16a34a]";

  const confidenceBadge = {
    high: {
      label: "High Confidence",
      className: "bg-green-100 text-green-800 border-0",
    },
    medium: {
      label: "Medium Confidence",
      className: "bg-amber-100 text-amber-800 border-0",
    },
    low: {
      label: "Low Confidence",
      className: "bg-red-100 text-red-800 border-0",
    },
  }[confidenceLevel];

  let rationale: string;
  if (
    recommendation.breakEvenMonths !== null &&
    recommendation.breakEvenMonths > 0
  ) {
    rationale = `Transition to ${STORAGE_CLASS_LABELS[recommendation.storageClass]} saves ${formatCurrency(recommendation.monthlySavings)}/mo (${savingsPercentValue}%) with a ${recommendation.breakEvenMonths.toFixed(1)}-month payback period.`;
  } else {
    rationale = `Transition to ${STORAGE_CLASS_LABELS[recommendation.storageClass]} saves ${formatCurrency(recommendation.monthlySavings)}/mo (${savingsPercentValue}%) with immediate savings — no transition costs.`;
  }

  // Retention vs break-even verdict
  const retentionMonths = inputs.retentionMonths;
  const breakEven = recommendation.breakEvenMonths;

  let verdict: { text: string; tone: "positive" | "caution" | "negative" } | null = null;

  if (breakEven !== null && retentionMonths > 0) {
    if (breakEven === 0) {
      verdict = {
        text: "Transition pays back immediately — no break-even period.",
        tone: "positive",
      };
    } else if (retentionMonths >= breakEven * 2) {
      verdict = {
        text: `Your ${retentionMonths}-month retention is well beyond the ${breakEven.toFixed(1)}-month break-even — this transition makes strong financial sense.`,
        tone: "positive",
      };
    } else if (retentionMonths >= breakEven) {
      verdict = {
        text: `Your ${retentionMonths}-month retention exceeds the ${breakEven.toFixed(1)}-month break-even — transition is financially justified.`,
        tone: "positive",
      };
    } else if (retentionMonths >= breakEven * 0.75) {
      verdict = {
        text: `Your ${retentionMonths}-month retention is close to the ${breakEven.toFixed(1)}-month break-even. Transition may not fully pay off.`,
        tone: "caution",
      };
    } else {
      verdict = {
        text: `Your ${retentionMonths}-month retention is shorter than the ${breakEven.toFixed(1)}-month break-even — transition costs won't be recovered.`,
        tone: "negative",
      };
    }
  }

  const verdictStyles = {
    positive: "text-[#16a34a]",
    caution: "text-[#d97706]",
    negative: "text-[#dc2626]",
  };

  const verdictIcons = {
    positive: "✓",
    caution: "⚠",
    negative: "✗",
  };

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
            Recommendation
            <InfoPopover text="The storage class with the lowest total cost of ownership for your workload, after modeling storage, request, retrieval, and monitoring costs together." />
          </h2>
          <span className="flex items-center gap-1.5">
            <InfoPopover text="Reflects both your stated confidence level and the quality of the inputs provided. Low confidence means the recommendation is directionally correct but should be validated with measured data." />
            <Badge className={confidenceBadge.className}>
              {confidenceBadge.label}
            </Badge>
          </span>
        </div>
        <div className="mb-1 text-base font-semibold text-foreground">
          {STORAGE_CLASS_LABELS[recommendation.storageClass]}
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className={`text-[32px] font-bold tabular-nums leading-tight ${isMarginal ? "text-[#d97706]" : "text-[#16a34a]"}`}
          >
            {formatCurrency(recommendation.monthlySavings)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[#6b7280]">
            /mo savings ({savingsPercentValue}%)
            <InfoPopover text="The difference between your current total monthly cost and the projected cost in the recommended class." />
          </span>
        </div>
        {verdict && (
          <p className={`text-sm mb-2 ${verdictStyles[verdict.tone]}`}>
            {verdictIcons[verdict.tone]} {verdict.text}
          </p>
        )}
        <p className="text-sm text-[#6b7280]">{rationale}</p>
      </CardContent>
    </Card>
  );
}

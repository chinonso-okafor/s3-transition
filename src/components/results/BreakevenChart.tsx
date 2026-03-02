"use client";

import { useMemo } from "react";
import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoPopover } from "@/components/ui/InfoPopover";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

interface BreakevenChartProps {
  output: CalculatorOutput;
}

export function BreakevenChart({ output }: BreakevenChartProps) {
  const { recommendation, inputs } = output;

  const currentResult = output.results.find(
    (r) => r.storageClass === inputs.currentClass
  );

  const currentMonthlyTotal = currentResult?.monthlyCost.total ?? 0;
  const recommendedMonthlyTotal = recommendation?.monthlyCost.total ?? 0;
  const transitionCost =
    (recommendation?.transitionCost ?? 0) +
    (recommendation?.minDurationPenalty ?? 0);

  const chartData = useMemo(() => {
    const data = [];
    for (let month = 0; month <= 24; month++) {
      data.push({
        month,
        current: currentMonthlyTotal * month,
        recommended: transitionCost + recommendedMonthlyTotal * month,
      });
    }
    return data;
  }, [currentMonthlyTotal, recommendedMonthlyTotal, transitionCost]);

  if (
    !recommendation ||
    !currentResult ||
    recommendation.monthlySavings <= 0
  ) {
    return null;
  }

  const currentLabel = STORAGE_CLASS_LABELS[inputs.currentClass];
  const recommendedLabel =
    STORAGE_CLASS_LABELS[recommendation.storageClass];

  const crossoverMonth = recommendation.breakEvenMonths;
  const crossoverValue =
    crossoverMonth !== null
      ? currentResult.monthlyCost.total * crossoverMonth
      : null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="flex items-center gap-1.5 text-xl font-semibold text-foreground mb-4">
          Break-Even Analysis
          <InfoPopover text="The point where cumulative savings from the new class exceed the one-time transition cost. A flatter line means a faster payback." />
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="" />
              <XAxis
                dataKey="month"
                label={{
                  value: "Months",
                  position: "insideBottom",
                  offset: -5,
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v.toFixed(0)}`
                }
                tick={{ fontSize: 12, fill: "#6b7280" }}
                width={60}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [
                  formatCurrency(Number(value)),
                ]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#9ca3af"
                strokeWidth={2}
                dot={false}
                name="current"
              />
              <Line
                type="monotone"
                dataKey="recommended"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="recommended"
              />
              {crossoverMonth !== null &&
                crossoverValue !== null &&
                crossoverMonth <= 24 && (
                  <ReferenceDot
                    x={Math.round(crossoverMonth)}
                    y={crossoverValue}
                    r={6}
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-[#9ca3af]" />
            <span className="text-[#6b7280]">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-[#2563eb]" />
            <span className="text-[#6b7280]">{recommendedLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {recommendation.breakEvenMonths !== null && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[#6b7280]">
                Pays back in
                <InfoPopover text="How many months until cumulative savings from transitioning to the recommended class exceed the one-time transition cost." />
              </span>
              <Badge variant="outline" className="font-semibold tabular-nums">
                {recommendation.breakEvenMonths.toFixed(1)} months
              </Badge>
              {recommendation.breakEvenDate && (
                <span className="text-[#6b7280]">
                  ({recommendation.breakEvenDate})
                </span>
              )}
            </div>
          )}

          {recommendation.minDurationPenalty > 0 && (
            <div className="w-full mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#374151]">
              <div className="font-medium mb-1">
                Total transition cost: {formatCurrency(recommendation.transitionCost + recommendation.minDurationPenalty)}
              </div>
              <div className="ml-4 space-y-0.5 text-[#6b7280]">
                <div>├── Lifecycle transition fee: {formatCurrency(recommendation.transitionCost)}</div>
                <div className="flex items-center gap-1.5 text-[#d97706]">
                  <span>└── Early deletion penalty: {formatCurrency(recommendation.minDurationPenalty)}</span>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          {recommendation.roi12Month !== null && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[#6b7280]">
                12-month ROI:
                <InfoPopover text="The net saving over one year after deducting the transition cost. A positive number means the transition pays off within the year." />
              </span>
              <Badge
                variant="outline"
                className={
                  recommendation.roi12Month > 0
                    ? "text-[#16a34a] border-green-300 font-semibold tabular-nums"
                    : "text-[#dc2626] border-red-300 font-semibold tabular-nums"
                }
              >
                {recommendation.roi12Month.toFixed(0)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

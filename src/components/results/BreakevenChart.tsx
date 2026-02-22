"use client";

import { useMemo } from "react";
import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Break-Even Analysis
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
              <span className="text-[#6b7280]">Pays back in</span>
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
          {recommendation.roi12Month !== null && (
            <div className="flex items-center gap-2">
              <span className="text-[#6b7280]">12-month ROI:</span>
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

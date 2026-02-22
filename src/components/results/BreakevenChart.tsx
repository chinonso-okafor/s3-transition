"use client";

import { useMemo } from "react";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
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
    (recommendation?.transitionCost ?? 0) + (recommendation?.minDurationPenalty ?? 0);

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

  if (!recommendation || !currentResult || recommendation.monthlySavings <= 0) {
    return null;
  }

  const currentLabel = STORAGE_CLASS_LABELS[inputs.currentClass];
  const recommendedLabel = STORAGE_CLASS_LABELS[recommendation.storageClass];

  const crossoverMonth = recommendation.breakEvenMonths;
  const crossoverValue =
    crossoverMonth !== null
      ? currentResult.monthlyCost.total * crossoverMonth
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Break-Even Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                label={{ value: "Months", position: "insideBottom", offset: -5 }}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`
                }
                width={60}
              />
              <RechartsTooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                ]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend
                formatter={(value: string) =>
                  value === "current" ? currentLabel : recommendedLabel
                }
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#6b7280"
                strokeWidth={2}
                dot={false}
                name="current"
              />
              <Line
                type="monotone"
                dataKey="recommended"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name="recommended"
              />
              {crossoverMonth !== null && crossoverValue !== null && crossoverMonth <= 24 && (
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

        <div className="flex flex-wrap gap-4 text-sm">
          {recommendation.breakEvenMonths !== null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Pays back in</span>
              <Badge variant="outline" className="font-semibold">
                {recommendation.breakEvenMonths.toFixed(1)} months
              </Badge>
              {recommendation.breakEvenDate && (
                <span className="text-muted-foreground">
                  ({recommendation.breakEvenDate})
                </span>
              )}
            </div>
          )}
          {recommendation.roi12Month !== null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">12-month ROI:</span>
              <Badge
                variant="outline"
                className={
                  recommendation.roi12Month > 0
                    ? "text-green-700 border-green-300 font-semibold"
                    : "text-red-700 border-red-300 font-semibold"
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

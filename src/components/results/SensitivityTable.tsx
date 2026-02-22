"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SensitivityTableProps {
  output: CalculatorOutput;
}

export function SensitivityTable({ output }: SensitivityTableProps) {
  const { sensitivityAnalysis, inputs } = output;

  if (sensitivityAnalysis.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Sensitivity Analysis</CardTitle>
        <CardDescription>
          How sensitive is this recommendation to changes in access frequency?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Scenario</th>
              <th className="pb-2 px-3 font-medium">Recommended Class</th>
              <th className="pb-2 px-3 font-medium text-right">Monthly TCO</th>
              <th className="pb-2 pl-3 font-medium text-right">vs Current</th>
            </tr>
          </thead>
          <tbody>
            {sensitivityAnalysis.map((scenario) => {
              const isSameAsCurrentRecommendation =
                output.recommendation?.storageClass === scenario.recommendedClass;
              const isCurrentClass = scenario.recommendedClass === inputs.currentClass;

              return (
                <tr key={scenario.label} className="border-b last:border-0">
                  <td className="py-2.5 pr-3 font-medium">
                    {scenario.label}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={isSameAsCurrentRecommendation ? "text-green-700 font-medium" : ""}>
                      {STORAGE_CLASS_LABELS[scenario.recommendedClass]}
                    </span>
                    {isCurrentClass && (
                      <span className="text-muted-foreground text-xs ml-1">(stay)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatCurrency(scenario.monthlyTCO)}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">
                    {scenario.monthlySavings > 0 ? (
                      <span className="text-green-600">
                        -{formatCurrency(scenario.monthlySavings)}
                      </span>
                    ) : scenario.monthlySavings < 0 ? (
                      <span className="text-red-600">
                        +{formatCurrency(Math.abs(scenario.monthlySavings))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

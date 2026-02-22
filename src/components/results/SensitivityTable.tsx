"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface SensitivityTableProps {
  output: CalculatorOutput;
}

export function SensitivityTable({ output }: SensitivityTableProps) {
  const { sensitivityAnalysis, inputs } = output;

  if (sensitivityAnalysis.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Sensitivity Analysis
        </h2>
        <p className="text-sm text-[#6b7280] mb-4">
          How sensitive is this recommendation to changes in access frequency?
        </p>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border bg-[#f9fafb]">
                <th className="py-3 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Scenario
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Recommended Class
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Monthly TCO
                </th>
                <th className="py-3 pl-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  vs Current
                </th>
              </tr>
            </thead>
            <tbody>
              {sensitivityAnalysis.map((scenario, index) => {
                const isSameAsCurrentRecommendation =
                  output.recommendation?.storageClass ===
                  scenario.recommendedClass;
                const isCurrentClass =
                  scenario.recommendedClass === inputs.currentClass;
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={scenario.label}
                    className={`border-b border-border last:border-0 h-12 ${isEven ? "bg-white" : "bg-[#f9fafb]"}`}
                  >
                    <td className="py-3 pr-3 font-medium">
                      {scenario.label}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          isSameAsCurrentRecommendation
                            ? "text-[#2563eb] font-medium"
                            : ""
                        }
                      >
                        {STORAGE_CLASS_LABELS[scenario.recommendedClass]}
                      </span>
                      {isCurrentClass && (
                        <span className="text-[#6b7280] text-xs ml-1">
                          (stay)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {formatCurrency(scenario.monthlyTCO)}
                    </td>
                    <td className="py-3 pl-3 tabular-nums">
                      {scenario.monthlySavings > 0 ? (
                        <span className="text-[#16a34a]">
                          -{formatCurrency(scenario.monthlySavings)}
                        </span>
                      ) : scenario.monthlySavings < 0 ? (
                        <span className="text-[#dc2626]">
                          +{formatCurrency(Math.abs(scenario.monthlySavings))}
                        </span>
                      ) : (
                        <span className="text-[#6b7280]">{"\u2014"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

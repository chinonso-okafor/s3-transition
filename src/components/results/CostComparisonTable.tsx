"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CostComparisonTableProps {
  output: CalculatorOutput;
}

export function CostComparisonTable({ output }: CostComparisonTableProps) {
  const { results, inputs } = output;
  const currentClassTCO =
    results.find((r) => r.storageClass === inputs.currentClass)?.monthlyCost
      .total ?? 0;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Cost Comparison
        </h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border bg-[#f9fafb]">
                <th className="py-3 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Class
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Storage
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] hidden sm:table-cell">
                  Requests
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] hidden sm:table-cell">
                  Retrieval
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] hidden md:table-cell">
                  Monitoring
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Total TCO
                </th>
                <th className="py-3 pl-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  vs Current
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const isCurrent = result.storageClass === inputs.currentClass;
                const isRecommended = result.isRecommended;
                const diff = currentClassTCO - result.monthlyCost.total;
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={result.storageClass}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors h-12",
                      isRecommended &&
                        "bg-[#eff6ff] border-l-4 border-l-[#2563eb]",
                      !isRecommended && isCurrent && "bg-[#f9fafb]",
                      !isRecommended && !isCurrent && isEven && "bg-white",
                      !isRecommended && !isCurrent && !isEven && "bg-[#f9fafb]",
                      !result.isEligible && "opacity-50"
                    )}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            isCurrent && "font-bold",
                            isRecommended && "font-semibold text-[#2563eb]"
                          )}
                        >
                          {STORAGE_CLASS_LABELS[result.storageClass]}
                        </span>
                        {isRecommended && (
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] px-1.5 py-0">
                            Best
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Current
                          </Badge>
                        )}
                        {!result.isEligible && result.ineligibleReason && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 opacity-60"
                                >
                                  N/A
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{result.ineligibleReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {formatCurrency(result.monthlyCost.storage)}
                    </td>
                    <td className="py-3 px-3 tabular-nums hidden sm:table-cell">
                      {formatCurrency(result.monthlyCost.requests)}
                    </td>
                    <td className="py-3 px-3 tabular-nums hidden sm:table-cell">
                      {formatCurrency(result.monthlyCost.retrieval)}
                    </td>
                    <td className="py-3 px-3 tabular-nums hidden md:table-cell">
                      {result.monthlyCost.monitoring > 0
                        ? formatCurrency(result.monthlyCost.monitoring)
                        : "\u2014"}
                    </td>
                    <td className="py-3 px-3 tabular-nums font-medium">
                      {formatCurrency(result.monthlyCost.total)}
                    </td>
                    <td className="py-3 pl-3 tabular-nums">
                      {isCurrent ? (
                        <span className="text-[#6b7280]">{"\u2014"}</span>
                      ) : diff > 0 ? (
                        <span className="text-[#16a34a] font-medium">
                          -{formatCurrency(diff)}
                        </span>
                      ) : (
                        <span className="text-[#dc2626]">
                          +{formatCurrency(Math.abs(diff))}
                        </span>
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

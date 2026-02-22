"use client";

import { CalculatorOutput } from "@/types";
import { STORAGE_CLASS_LABELS } from "@/lib/pricing";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cost Comparison</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Class</th>
              <th className="pb-2 px-3 font-medium text-right">Storage</th>
              <th className="pb-2 px-3 font-medium text-right hidden sm:table-cell">Requests</th>
              <th className="pb-2 px-3 font-medium text-right hidden sm:table-cell">Retrieval</th>
              <th className="pb-2 px-3 font-medium text-right hidden md:table-cell">Monitoring</th>
              <th className="pb-2 px-3 font-medium text-right">Total TCO</th>
              <th className="pb-2 pl-3 font-medium text-right">vs Current</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const isCurrent = result.storageClass === inputs.currentClass;
              const isRecommended = result.isRecommended;
              const diff = currentClassTCO - result.monthlyCost.total;

              return (
                <tr
                  key={result.storageClass}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isRecommended && "bg-green-50",
                    isCurrent && "bg-muted/30",
                    !result.isEligible && "opacity-50"
                  )}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", isRecommended && "text-green-700")}>
                        {STORAGE_CLASS_LABELS[result.storageClass]}
                      </span>
                      {isRecommended && (
                        <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0">
                          Best
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Current
                        </Badge>
                      )}
                      {!result.isEligible && result.ineligibleReason && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 opacity-60">
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
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatCurrency(result.monthlyCost.storage)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell">
                    {formatCurrency(result.monthlyCost.requests)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell">
                    {formatCurrency(result.monthlyCost.retrieval)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums hidden md:table-cell">
                    {result.monthlyCost.monitoring > 0
                      ? formatCurrency(result.monthlyCost.monitoring)
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                    {formatCurrency(result.monthlyCost.total)}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">
                    {isCurrent ? (
                      <span className="text-muted-foreground">—</span>
                    ) : diff > 0 ? (
                      <span className="text-green-600 font-medium">
                        -{formatCurrency(diff)}
                      </span>
                    ) : (
                      <span className="text-red-600">
                        +{formatCurrency(Math.abs(diff))}
                      </span>
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

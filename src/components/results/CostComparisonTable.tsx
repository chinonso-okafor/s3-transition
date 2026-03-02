"use client";

import { StorageClass, CalculatorOutput } from "@/types";
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
import { InfoPopover } from "@/components/ui/InfoPopover";

interface CostComparisonTableProps {
  output: CalculatorOutput;
}

const ASYNC_CLASSES: StorageClass[] = [
  StorageClass.GLACIER_FLEXIBLE,
  StorageClass.GLACIER_DEEP_ARCHIVE,
];

export function CostComparisonTable({ output }: CostComparisonTableProps) {
  const { results, inputs } = output;
  const currentClassTCO =
    results.find((r) => r.storageClass === inputs.currentClass)?.monthlyCost
      .total ?? 0;

  const showDataTransferColumn = (inputs.monthlyDataTransferOutGB ?? 0) > 0;
  const showPenaltyColumn = results.some((r) => r.minDurationPenalty > 0);
  const showTieredNote =
    inputs.storageGB > 51200 &&
    results.some(
      (r) =>
        r.storageClass === StorageClass.STANDARD &&
        (r.storageClass === inputs.currentClass || r.isRecommended)
    );

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="flex items-center gap-1.5 text-xl font-semibold text-foreground mb-4">
          Cost Comparison
          <InfoPopover text="Total monthly cost for each storage class modeled against your inputs. Storage, requests, retrieval, and monitoring costs are shown separately so you can see where the differences come from." />
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
                {showDataTransferColumn && (
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] hidden md:table-cell">
                    Data Transfer
                  </th>
                )}
                {showPenaltyColumn && (
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] hidden sm:table-cell">
                    <span className="flex items-center gap-1">
                      Penalty
                      <InfoPopover text="One-time charge for storing objects less than the class minimum duration (30–180 days depending on class). Added to transition cost in break-even calculation." />
                    </span>
                  </th>
                )}
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
                const isAsync = ASYNC_CLASSES.includes(result.storageClass);

                // Blended effective rate for Standard when tiered pricing applies
                const showBlendedRate =
                  result.storageClass === StorageClass.STANDARD &&
                  inputs.storageGB > 51200;
                const blendedRate = showBlendedRate
                  ? result.monthlyCost.storage /
                    output.derivedValues.regionalMultiplier /
                    inputs.storageGB
                  : null;

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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {isAsync && inputs.requiresImmediateAccess && (
                          <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] px-1.5 py-0">
                            Requires restore request
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
                      <div>
                        {formatCurrency(result.monthlyCost.storage)}
                        {blendedRate !== null && (
                          <div className="text-[11px] text-[#6b7280]">
                            avg ${blendedRate.toFixed(3)}/GB
                          </div>
                        )}
                      </div>
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
                    {showDataTransferColumn && (
                      <td className="py-3 px-3 tabular-nums hidden md:table-cell">
                        {formatCurrency(result.monthlyCost.dataTransfer)}
                      </td>
                    )}
                    {showPenaltyColumn && (
                      <td className="py-3 px-3 tabular-nums hidden sm:table-cell">
                        {result.minDurationPenalty > 0 ? (
                          <span className="text-[#d97706]">
                            {formatCurrency(result.minDurationPenalty)}
                          </span>
                        ) : (
                          <span className="text-[#6b7280]">{"\u2014"}</span>
                        )}
                      </td>
                    )}
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

        {/* Tiered pricing note */}
        {showTieredNote && (
          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#374151]">
            <strong>Tiered pricing applied.</strong> S3 Standard rates step down
            at 50 TB ($0.022/GB) and 500 TB ($0.021/GB). Billing is calculated at
            the AWS account level — your actual effective rate depends on total
            Standard storage across your entire account in this region, not this
            bucket alone.
          </div>
        )}

        {/* Data transfer note */}
        {showDataTransferColumn && (
          <p className="mt-2 text-xs text-[#6b7280]">
            Data Transfer Out is the same across all classes — does not affect
            recommendation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

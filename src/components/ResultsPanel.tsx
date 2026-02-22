"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { CostComparisonTable } from "@/components/results/CostComparisonTable";
import { BreakevenChart } from "@/components/results/BreakevenChart";
import { SensitivityTable } from "@/components/results/SensitivityTable";
import { WarningsPanel } from "@/components/results/WarningsPanel";
import { EOZCard } from "@/components/results/EOZCard";
import { Card, CardContent } from "@/components/ui/card";

export function ResultsPanel() {
  const output = useCalculatorStore((s) => s.output);

  if (!output) {
    return (
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardContent className="flex h-full min-h-[400px] items-center justify-center p-6">
            <div className="text-center space-y-3">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Enter your workload details
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Fill in your storage volume and object count in the input panel
                  to see cost optimization recommendations across all S3 storage
                  classes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <RecommendationCard output={output} />
      <CostComparisonTable output={output} />
      <BreakevenChart output={output} />
      <SensitivityTable output={output} />
      <WarningsPanel output={output} />
      <EOZCard output={output} />
    </div>
  );
}

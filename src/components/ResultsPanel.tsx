"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { CostComparisonTable } from "@/components/results/CostComparisonTable";
import { BreakevenChart } from "@/components/results/BreakevenChart";
import { SensitivityTable } from "@/components/results/SensitivityTable";
import { WarningsPanel } from "@/components/results/WarningsPanel";
import { EOZCard } from "@/components/results/EOZCard";

export function ResultsPanel() {
  const output = useCalculatorStore((s) => s.output);

  if (!output) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-6 w-6 text-[#9ca3af]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
          <p className="mt-3 text-sm text-[#6b7280]">
            Enter your workload details to see recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RecommendationCard output={output} />
      <CostComparisonTable output={output} />

      {/* EDP Disclaimer */}
      <p className="text-[13px] leading-relaxed text-[#9ca3af]">
        Cost estimates reflect AWS list prices. EDP/PPA are not currently modeled. If your organization has negotiated AWS pricing, apply your discount rate to all figures shown. The recommended storage class remains the same regardless of discount rate. Lifecycle policy modeling is also not yet available; see the FAQ for guidance on multi-class transition costs.
      </p>

      <BreakevenChart output={output} />
      <SensitivityTable output={output} />
      <WarningsPanel output={output} />
      <EOZCard output={output} />
    </div>
  );
}

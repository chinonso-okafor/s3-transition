"use client";

import { useState } from "react";
import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoPopover } from "@/components/ui/InfoPopover";

export function AccessPatternInputs() {
  const monthlyGetRequests = useCalculatorStore(
    (s) => s.inputs.monthlyGetRequests
  );
  const monthlyRetrievalGB = useCalculatorStore(
    (s) => s.inputs.monthlyRetrievalGB
  );
  const storageGB = useCalculatorStore((s) => s.inputs.storageGB);
  const objectCount = useCalculatorStore((s) => s.inputs.objectCount);
  const setInput = useCalculatorStore((s) => s.setInput);

  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [confidenceAutoSet, setConfidenceAutoSet] = useState(false);

  const derivedAvgObjectSizeMB =
    storageGB > 0 && objectCount > 0
      ? (storageGB * 1024) / objectCount
      : 0;

  const [estRequests, setEstRequests] = useState<number>(0);
  const [estObjectSizeMB, setEstObjectSizeMB] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleOpenEstimator = () => {
    if (!hasInitialized) {
      setEstRequests(monthlyGetRequests || 0);
      setEstObjectSizeMB(
        derivedAvgObjectSizeMB > 0
          ? parseFloat(derivedAvgObjectSizeMB.toFixed(4))
          : 0
      );
      setHasInitialized(true);
    }
    setEstimatorOpen(true);
  };

  const estimatedGB =
    estRequests > 0 && estObjectSizeMB > 0
      ? (estRequests * estObjectSizeMB) / 1024
      : 0;

  const handleApplyEstimate = () => {
    const rounded = parseFloat(estimatedGB.toFixed(2));
    setInput("monthlyRetrievalGB", rounded);
    setInput("accessPatternConfidence", "low");
    setConfidenceAutoSet(true);
    setEstimatorOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="monthly-get-requests"
          className="flex items-center gap-1.5 text-sm font-medium leading-none"
        >
          Monthly GET Requests
          <InfoPopover text="The number of times objects in this bucket are read per month. Find this in AWS CloudWatch under the GetRequests metric for your bucket." />
        </label>
        <Input
          id="monthly-get-requests"
          type="number"
          min={0}
          step={1000}
          placeholder="e.g. 5000000"
          value={monthlyGetRequests || ""}
          onChange={(e) =>
            setInput(
              "monthlyGetRequests",
              parseInt(e.target.value, 10) || 0
            )
          }
          aria-label="Monthly GET requests"
        />
        <p className="text-xs text-muted-foreground">
          Total GET requests across all objects per month
        </p>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="monthly-retrieval-gb"
          className="flex items-center gap-1.5 text-sm font-medium leading-none"
        >
          Monthly Retrieval (GB)
          <InfoPopover text="The total volume of data downloaded from this bucket each month. This drives retrieval costs in IA and Glacier classes and is the most commonly missing input in cost optimization analyses." />
        </label>
        <Input
          id="monthly-retrieval-gb"
          type="number"
          min={0}
          step={1}
          placeholder="e.g. 500"
          value={monthlyRetrievalGB || ""}
          onChange={(e) =>
            setInput(
              "monthlyRetrievalGB",
              parseFloat(e.target.value) || 0
            )
          }
          aria-label="Monthly data retrieval in gigabytes"
        />
        <p className="text-xs text-muted-foreground">
          GB of data actually retrieved per month
        </p>

        {!estimatorOpen && (
          <button
            type="button"
            onClick={handleOpenEstimator}
            className="text-xs font-medium text-[#6b7280] hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            Don&apos;t have this figure? Estimate it from your request data.
          </button>
        )}

        {estimatorOpen && (
          <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              Retrieval Estimator
            </p>
            <div className="space-y-2">
              <label
                htmlFor="est-read-requests"
                className="text-xs font-medium text-[#6b7280]"
              >
                Avg read requests per month
              </label>
              <Input
                id="est-read-requests"
                type="number"
                min={0}
                step={1000}
                placeholder="e.g. 5000000"
                value={estRequests || ""}
                onChange={(e) =>
                  setEstRequests(parseInt(e.target.value, 10) || 0)
                }
                aria-label="Estimated average read requests per month"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="est-object-size"
                className="text-xs font-medium text-[#6b7280]"
              >
                Avg object size (MB)
              </label>
              <Input
                id="est-object-size"
                type="number"
                min={0}
                step={0.1}
                placeholder="e.g. 2.5"
                value={estObjectSizeMB || ""}
                onChange={(e) =>
                  setEstObjectSizeMB(parseFloat(e.target.value) || 0)
                }
                aria-label="Estimated average object size in megabytes"
              />
            </div>
            <div className="text-sm text-[#111827] font-medium tabular-nums">
              Estimated retrieval:{" "}
              <span className="text-[#2563eb]">
                {estimatedGB > 0 ? estimatedGB.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
              </span>{" "}
              GB/month
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={estimatedGB <= 0}
                onClick={handleApplyEstimate}
              >
                Use this estimate
              </Button>
              <button
                type="button"
                onClick={() => setEstimatorOpen(false)}
                className="text-xs text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {confidenceAutoSet && !estimatorOpen && (
          <p className="text-xs text-[#d97706] mt-1">
            Confidence set to Low — estimated value, not measured
          </p>
        )}
      </div>
    </div>
  );
}

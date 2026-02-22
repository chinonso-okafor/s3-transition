"use client";

import { useCalculatorStore } from "@/store/calculatorStore";
import { Input } from "@/components/ui/input";

export function AccessPatternInputs() {
  const monthlyGetRequests = useCalculatorStore(
    (s) => s.inputs.monthlyGetRequests
  );
  const monthlyRetrievalGB = useCalculatorStore(
    (s) => s.inputs.monthlyRetrievalGB
  );
  const setInput = useCalculatorStore((s) => s.setInput);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="monthly-get-requests"
          className="text-sm font-medium leading-none"
        >
          Monthly GET Requests
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
          className="text-sm font-medium leading-none"
        >
          Monthly Retrieval (GB)
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
      </div>
    </div>
  );
}

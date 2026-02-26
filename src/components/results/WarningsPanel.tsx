"use client";

import { useState } from "react";
import { CalculatorOutput } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { InfoPopover } from "@/components/ui/InfoPopover";

interface WarningsPanelProps {
  output: CalculatorOutput;
}

export function WarningsPanel({ output }: WarningsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const allWarnings = [...output.warnings];
  const resultWarnings = output.results.flatMap((r) =>
    r.isRecommended ? r.warnings : []
  );
  const combinedWarnings = Array.from(
    new Set([...allWarnings, ...resultWarnings])
  );

  if (combinedWarnings.length === 0) return null;

  return (
    <div className="rounded-lg bg-[#fffbeb] border border-[#fde68a] border-l-4 border-l-[#d97706]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              Warnings & Caveats
              <InfoPopover text="Specific conditions in your workload that could affect recommendation accuracy. Review all warnings before making a transition decision." />
            </h2>
            <Badge className="bg-amber-100 text-amber-800 border-0">
              {combinedWarnings.length}
            </Badge>
          </div>
          <svg
            className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-4">
            <ul className="space-y-2" role="list">
              {combinedWarnings.map((warning, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-[#92400e]"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

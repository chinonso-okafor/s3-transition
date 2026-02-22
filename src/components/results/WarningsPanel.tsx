"use client";

import { useState } from "react";
import { CalculatorOutput } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface WarningsPanelProps {
  output: CalculatorOutput;
}

export function WarningsPanel({ output }: WarningsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const allWarnings = [...output.warnings];
  const resultWarnings = output.results.flatMap((r) =>
    r.isRecommended ? r.warnings : []
  );
  const combinedWarnings = Array.from(new Set([...allWarnings, ...resultWarnings]));

  if (combinedWarnings.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Warnings & Caveats</CardTitle>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300"
              >
                {combinedWarnings.length}
              </Badge>
            </div>
            <svg
              className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ul className="space-y-2" role="list">
              {combinedWarnings.map((warning, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm text-amber-900"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

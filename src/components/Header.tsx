"use client";

import { PRICING_LAST_VERIFIED } from "@/lib/pricing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  return (
    <header className="h-16 shrink-0 bg-[#111827] px-6 flex items-center justify-between">
      <span className="text-base font-semibold text-white">S3 Optimizer</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#d1d5db] transition-colors"
              aria-label="Pricing last verified information"
            >
              <span>Pricing verified {PRICING_LAST_VERIFIED}</span>
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>
              Prices are hardcoded from AWS published rates (post April 2025)
              and manually verified. They are not fetched live from the AWS
              Pricing API.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
}

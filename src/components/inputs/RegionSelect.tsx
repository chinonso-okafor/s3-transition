"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { AWSRegion } from "@/types";
import { REGION_LABELS, REGION_GROUPS } from "@/lib/pricing";
import { useCalculatorStore } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function RegionSelect() {
  const region = useCalculatorStore((s) => s.inputs.region);
  const setInput = useCalculatorStore((s) => s.setInput);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor="region-select"
        className="text-sm font-medium leading-none"
      >
        AWS Region
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="region-select"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="AWS Region"
            className="w-full justify-between font-normal"
          >
            {region ? (
              <span className="truncate">
                {REGION_LABELS[region]}
                <span className="text-muted-foreground"> &mdash; </span>
                <span className="font-mono text-muted-foreground">
                  {region}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select region</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command
            filter={(value, search) => {
              const r = value as AWSRegion;
              const label = REGION_LABELS[r] ?? "";
              const haystack = `${label} ${r}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Search regions..." />
            <CommandList>
              <CommandEmpty>No region found.</CommandEmpty>
              {REGION_GROUPS.map((group) => (
                <CommandGroup
                  key={group.label}
                  heading={group.label}
                >
                  {group.regions.map((r) => (
                    <CommandItem
                      key={r}
                      value={r}
                      onSelect={(value) => {
                        setInput("region", value as AWSRegion);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          region === r ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">
                        {REGION_LABELS[r]}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {r}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

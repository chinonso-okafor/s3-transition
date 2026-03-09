import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip commas from pasted numeric strings before parsing. */
export function parseIntFromInput(value: string): number {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

/** Strip commas from pasted numeric strings before parsing as float. */
export function parseFloatFromInput(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

import { create } from "zustand";
import {
  CalculatorInputs,
  CalculatorOutput,
  StorageClass,
  AWSRegion,
} from "@/types";
import { calculate } from "@/lib/calculator";

interface CalculatorState {
  inputs: CalculatorInputs;
  output: CalculatorOutput | null;
  setInput: <K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K]
  ) => void;
  resetInputs: () => void;
}

const defaultInputs: CalculatorInputs = {
  storageGB: 0,
  objectCount: 0,
  monthlyGetRequests: 0,
  monthlyRetrievalGB: 0,
  currentClass: StorageClass.STANDARD,
  region: AWSRegion.US_EAST_1,
  retentionMonths: 12,
  isMutable: false,
  accessPatternConfidence: "medium",
  glacierRetrievalTier: "standard",
  itArchiveTiersEnabled: false,
};

function computeOutput(inputs: CalculatorInputs): CalculatorOutput | null {
  if (inputs.storageGB <= 0 || inputs.objectCount <= 0) return null;
  return calculate(inputs);
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  inputs: defaultInputs,
  output: null,
  setInput: (key, value) =>
    set((state) => {
      const newInputs = { ...state.inputs, [key]: value };
      return {
        inputs: newInputs,
        output: computeOutput(newInputs),
      };
    }),
  resetInputs: () => set({ inputs: defaultInputs, output: null }),
}));

import { create } from "zustand";
import {
  CalculatorInputs,
  CalculatorOutput,
  StorageClass,
  AWSRegion,
} from "@/types";

interface CalculatorState {
  inputs: CalculatorInputs;
  output: CalculatorOutput | null;
  setInput: <K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K]
  ) => void;
  setOutput: (output: CalculatorOutput) => void;
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
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  inputs: defaultInputs,
  output: null,
  setInput: (key, value) =>
    set((state) => ({
      inputs: { ...state.inputs, [key]: value },
    })),
  setOutput: (output) => set({ output }),
  resetInputs: () => set({ inputs: defaultInputs, output: null }),
}));

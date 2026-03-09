import { create } from "zustand";
import {
  BucketMode,
  CalculatorInputs,
  CalculatorOutput,
  MixedSegment,
  StorageClass,
  AWSRegion,
} from "@/types";
import { calculate, calculateMixedBucketTCO } from "@/lib/calculator";

interface CalculatorState {
  inputs: CalculatorInputs;
  output: CalculatorOutput | null;
  setInput: <K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K]
  ) => void;
  setBucketMode: (mode: BucketMode) => void;
  addMixedSegment: () => void;
  updateMixedSegment: (id: string, updates: Partial<MixedSegment>) => void;
  removeMixedSegment: (id: string) => void;
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
  requiresImmediateAccess: true,
  monthlyPutRequests: 0,
  monthlyRestoreRequests: 0,
  monthlyDataTransferOutGB: 0,
  bucketMode: "single",
  mixedSegments: [],
};

let segmentCounter = 0;
function generateSegmentId(): string {
  segmentCounter += 1;
  return `seg-${Date.now()}-${segmentCounter}`;
}

function computeOutput(inputs: CalculatorInputs): CalculatorOutput | null {
  if (inputs.bucketMode === "mixed") {
    const validSegments = inputs.mixedSegments.filter(
      (s) => s.storageGB > 0
    );
    if (validSegments.length < 2 || inputs.objectCount <= 0) return null;
    return calculateMixedBucketTCO(inputs);
  }
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
  setBucketMode: (mode) =>
    set((state) => {
      const newInputs = { ...state.inputs, bucketMode: mode };
      // If switching to mixed and no segments exist, seed with two empty rows
      if (mode === "mixed" && newInputs.mixedSegments.length < 2) {
        newInputs.mixedSegments = [
          { id: generateSegmentId(), storageClass: StorageClass.STANDARD, storageGB: 0 },
          { id: generateSegmentId(), storageClass: StorageClass.STANDARD_IA, storageGB: 0 },
        ];
      }
      return {
        inputs: newInputs,
        output: computeOutput(newInputs),
      };
    }),
  addMixedSegment: () =>
    set((state) => {
      const newSegments = [
        ...state.inputs.mixedSegments,
        { id: generateSegmentId(), storageClass: StorageClass.STANDARD, storageGB: 0 },
      ];
      const newInputs = { ...state.inputs, mixedSegments: newSegments };
      return {
        inputs: newInputs,
        output: computeOutput(newInputs),
      };
    }),
  updateMixedSegment: (id, updates) =>
    set((state) => {
      const newSegments = state.inputs.mixedSegments.map((seg) =>
        seg.id === id ? { ...seg, ...updates } : seg
      );
      const newInputs = { ...state.inputs, mixedSegments: newSegments };
      return {
        inputs: newInputs,
        output: computeOutput(newInputs),
      };
    }),
  removeMixedSegment: (id) =>
    set((state) => {
      const newSegments = state.inputs.mixedSegments.filter(
        (seg) => seg.id !== id
      );
      const newInputs = { ...state.inputs, mixedSegments: newSegments };
      return {
        inputs: newInputs,
        output: computeOutput(newInputs),
      };
    }),
  resetInputs: () => set({ inputs: defaultInputs, output: null }),
}));

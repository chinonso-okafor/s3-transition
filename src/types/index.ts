export enum StorageClass {
  EXPRESS_ONE_ZONE = "express-one-zone",
  STANDARD = "standard",
  INTELLIGENT_TIERING = "intelligent-tiering",
  STANDARD_IA = "standard-ia",
  ONE_ZONE_IA = "one-zone-ia",
  GLACIER_INSTANT = "glacier-instant",
  GLACIER_FLEXIBLE = "glacier-flexible",
  GLACIER_DEEP_ARCHIVE = "glacier-deep-archive",
}

export enum AWSRegion {
  US_EAST_1 = "us-east-1",
  US_EAST_2 = "us-east-2",
  US_WEST_1 = "us-west-1",
  US_WEST_2 = "us-west-2",
  CA_CENTRAL_1 = "ca-central-1",
  SA_EAST_1 = "sa-east-1",
  US_GOV_WEST_1 = "us-gov-west-1",
  EU_CENTRAL_1 = "eu-central-1",
  EU_WEST_1 = "eu-west-1",
  EU_WEST_2 = "eu-west-2",
  EU_NORTH_1 = "eu-north-1",
  AP_NORTHEAST_1 = "ap-northeast-1",
  AP_SOUTHEAST_1 = "ap-southeast-1",
  AP_SOUTH_1 = "ap-south-1",
  AP_SOUTHEAST_2 = "ap-southeast-2",
}

export type AccessPatternConfidence = "low" | "medium" | "high";

export type GlacierRetrievalTier = "expedited" | "standard" | "bulk";

export interface CalculatorInputs {
  storageGB: number;
  objectCount: number;
  monthlyGetRequests: number;
  monthlyRetrievalGB: number;
  currentClass: StorageClass;
  region: AWSRegion;
  retentionMonths: number;
  isMutable: boolean;
  accessPatternConfidence: AccessPatternConfidence;
  glacierRetrievalTier: GlacierRetrievalTier;
}

export interface StorageClassResult {
  storageClass: StorageClass;
  monthlyCost: {
    storage: number;
    requests: number;
    retrieval: number;
    monitoring: number;
    total: number;
  };
  transitionCost: number;
  minDurationPenalty: number;
  monthlySavings: number;
  breakEvenMonths: number | null;
  breakEvenDate: string | null;
  roi12Month: number | null;
  isRecommended: boolean;
  isEligible: boolean;
  ineligibleReason?: string;
  warnings: string[];
}

export interface EOZResult {
  isEligible: boolean;
  ineligibleReason?: string;
  monthlyCost: {
    storage: number;
    upload: number;
    retrieval: number;
    requests: number;
    total: number;
  };
  premiumOverStandard: number;
}

export interface SensitivityScenario {
  label: string;
  retrievalMultiplier: number;
  recommendedClass: StorageClass;
  monthlyTCO: number;
  monthlySavings: number;
}

export interface CalculatorOutput {
  inputs: CalculatorInputs;
  derivedValues: {
    avgObjectSizeKB: number;
    billedStorageGB_IA: number;
    billedStorageGB_Glacier: number;
    regionalMultiplier: number;
    isEOZEligible: boolean;
    smallObjectPenaltyActive: boolean;
    smallObjectInflationRatio: number | null;
  };
  results: StorageClassResult[];
  recommendation: StorageClassResult | null;
  eozResult: EOZResult | null;
  sensitivityAnalysis: SensitivityScenario[];
  warnings: string[];
  confidenceLevel: AccessPatternConfidence;
}

export interface StorageClassPricing {
  storagePerGB: number;
  putPer1K: number;
  getPer1K: number;
  retrievalPerGB: number;
  transitionPer1K: number;
  minDurationDays: number;
  minObjectSizeKB: number;
  monitoringPer1KObjects: number;
  availableRegions: "all" | AWSRegion[];
}

export interface EOZPricing {
  storagePerGB: number;
  putPer1K: number;
  getPer1K: number;
  retrievalPerGB: number;
  uploadPerGB: number;
  availableRegions: AWSRegion[];
}

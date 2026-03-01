export enum StorageClass {
  EXPRESS_ONE_ZONE = "express-one-zone",
  STANDARD = "standard",
  INTELLIGENT_TIERING = "intelligent-tiering",
  STANDARD_IA = "standard-ia",
  ONE_ZONE_IA = "one-zone-ia",
  GLACIER_INSTANT = "glacier-instant",
  GLACIER_FLEXIBLE = "glacier-flexible",
  GLACIER_DEEP_ARCHIVE = "glacier-deep-archive",
  REDUCED_REDUNDANCY = "REDUCED_REDUNDANCY",
}

export enum AWSRegion {
  // North America
  US_EAST_1 = "us-east-1",
  US_EAST_2 = "us-east-2",
  US_WEST_1 = "us-west-1",
  US_WEST_2 = "us-west-2",
  CA_CENTRAL_1 = "ca-central-1",
  CA_WEST_1 = "ca-west-1",
  MX_CENTRAL_1 = "mx-central-1",
  // South America
  SA_EAST_1 = "sa-east-1",
  // Europe
  EU_CENTRAL_1 = "eu-central-1",
  EU_CENTRAL_2 = "eu-central-2",
  EU_WEST_1 = "eu-west-1",
  EU_WEST_2 = "eu-west-2",
  EU_WEST_3 = "eu-west-3",
  EU_SOUTH_1 = "eu-south-1",
  EU_SOUTH_2 = "eu-south-2",
  EU_NORTH_1 = "eu-north-1",
  // Africa
  AF_SOUTH_1 = "af-south-1",
  // Middle East
  ME_CENTRAL_1 = "me-central-1",
  ME_SOUTH_1 = "me-south-1",
  IL_CENTRAL_1 = "il-central-1",
  // Asia Pacific
  AP_NORTHEAST_1 = "ap-northeast-1",
  AP_NORTHEAST_2 = "ap-northeast-2",
  AP_NORTHEAST_3 = "ap-northeast-3",
  AP_SOUTHEAST_1 = "ap-southeast-1",
  AP_SOUTHEAST_2 = "ap-southeast-2",
  AP_SOUTHEAST_3 = "ap-southeast-3",
  AP_SOUTHEAST_4 = "ap-southeast-4",
  AP_SOUTHEAST_5 = "ap-southeast-5",
  AP_SOUTHEAST_7 = "ap-southeast-7",
  AP_EAST_1 = "ap-east-1",
  AP_SOUTH_1 = "ap-south-1",
  // GovCloud
  US_GOV_WEST_1 = "us-gov-west-1",
  US_GOV_EAST_1 = "us-gov-east-1",
}

export type BucketMode = "single" | "mixed";

export interface MixedSegment {
  id: string;
  storageClass: StorageClass;
  storageGB: number;
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
  itArchiveTiersEnabled: boolean;
  requiresImmediateAccess: boolean;
  monthlyDataTransferOutGB: number;
  bucketMode: BucketMode;
  mixedSegments: MixedSegment[];
}

export interface StorageClassResult {
  storageClass: StorageClass;
  monthlyCost: {
    storage: number;
    requests: number;
    retrieval: number;
    monitoring: number;
    dataTransfer: number;
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
  isDeprecated?: boolean;
  deprecationNote?: string;
}

export interface EOZPricing {
  storagePerGB: number;
  putPer1K: number;
  getPer1K: number;
  retrievalPerGB: number;
  uploadPerGB: number;
  availableRegions: AWSRegion[];
}

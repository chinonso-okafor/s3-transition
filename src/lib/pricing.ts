import {
  StorageClass,
  AWSRegion,
  StorageClassPricing,
  EOZPricing,
} from "@/types";

export const PRICING_LAST_VERIFIED = "2025-04-10";

export const PRICING: Record<StorageClass, StorageClassPricing> = {
  [StorageClass.STANDARD]: {
    storagePerGB: 0.023,
    putPer1K: 0.005,
    getPer1K: 0.0004,
    retrievalPerGB: 0,
    transitionPer1K: 0,
    minDurationDays: 0,
    minObjectSizeKB: 0,
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.INTELLIGENT_TIERING]: {
    storagePerGB: 0.023, // Frequent Access tier rate; blended rate calculated dynamically
    putPer1K: 0.005,
    getPer1K: 0.0004,
    retrievalPerGB: 0,
    transitionPer1K: 0,
    minDurationDays: 0,
    minObjectSizeKB: 0,
    monitoringPer1KObjects: 0.0025,
    availableRegions: "all",
  },
  [StorageClass.STANDARD_IA]: {
    storagePerGB: 0.0125,
    putPer1K: 0.01,
    getPer1K: 0.001,
    retrievalPerGB: 0.01,
    transitionPer1K: 0.01,
    minDurationDays: 30,
    minObjectSizeKB: 128,
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.ONE_ZONE_IA]: {
    storagePerGB: 0.01,
    putPer1K: 0.01,
    getPer1K: 0.001,
    retrievalPerGB: 0.01,
    transitionPer1K: 0.01,
    minDurationDays: 30,
    minObjectSizeKB: 128,
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.GLACIER_INSTANT]: {
    storagePerGB: 0.004,
    putPer1K: 0.02,
    getPer1K: 0.01,
    retrievalPerGB: 0.03,
    transitionPer1K: 0.02,
    minDurationDays: 90,
    minObjectSizeKB: 128,
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.GLACIER_FLEXIBLE]: {
    storagePerGB: 0.0036,
    putPer1K: 0.03,
    getPer1K: 0.0004,
    retrievalPerGB: 0.01, // Standard retrieval tier default
    transitionPer1K: 0.03,
    minDurationDays: 90,
    minObjectSizeKB: 0, // 40 KB metadata overhead handled separately
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.GLACIER_DEEP_ARCHIVE]: {
    storagePerGB: 0.00099,
    putPer1K: 0.05,
    getPer1K: 0.0004,
    retrievalPerGB: 0.02, // Standard retrieval tier default
    transitionPer1K: 0.05,
    minDurationDays: 180,
    minObjectSizeKB: 0, // 40 KB metadata overhead handled separately
    monitoringPer1KObjects: 0,
    availableRegions: "all",
  },
  [StorageClass.EXPRESS_ONE_ZONE]: {
    storagePerGB: 0.11,
    putPer1K: 0.00113,
    getPer1K: 0.00003,
    retrievalPerGB: 0.0006,
    transitionPer1K: 0, // No lifecycle transition — copy only
    minDurationDays: 0,
    minObjectSizeKB: 0,
    monitoringPer1KObjects: 0,
    availableRegions: [
      AWSRegion.US_EAST_1,
      AWSRegion.US_EAST_2,
      AWSRegion.US_WEST_2,
      AWSRegion.AP_SOUTH_1,
      AWSRegion.AP_NORTHEAST_1,
      AWSRegion.EU_WEST_1,
      AWSRegion.EU_NORTH_1,
    ],
  },
};

export const EOZ_PRICING: EOZPricing = {
  storagePerGB: 0.11,
  putPer1K: 0.00113,
  getPer1K: 0.00003,
  retrievalPerGB: 0.0006,
  uploadPerGB: 0.0032,
  availableRegions: [
    AWSRegion.US_EAST_1,
    AWSRegion.US_EAST_2,
    AWSRegion.US_WEST_2,
    AWSRegion.AP_SOUTH_1,
    AWSRegion.AP_NORTHEAST_1,
    AWSRegion.EU_WEST_1,
    AWSRegion.EU_NORTH_1,
  ],
};

export const INTELLIGENT_TIERING_STORAGE_RATES = {
  frequent: 0.023,
  infrequent: 0.0125,
  archiveInstant: 0.004,
};

export const GLACIER_RETRIEVAL_COSTS: Record<
  "expedited" | "standard" | "bulk",
  { perGB: number; per1KRequests: number }
> = {
  expedited: { perGB: 0.03, per1KRequests: 0.01 },
  standard: { perGB: 0.01, per1KRequests: 0.0004 },
  bulk: { perGB: 0.0, per1KRequests: 0.0 },
};

export const DEEP_ARCHIVE_RETRIEVAL_COSTS: Record<
  "standard" | "bulk",
  { perGB: number }
> = {
  standard: { perGB: 0.02 },
  bulk: { perGB: 0.0025 },
};

export const REGIONAL_MULTIPLIERS: Record<AWSRegion, number> = {
  [AWSRegion.US_EAST_1]: 1.0,
  [AWSRegion.US_EAST_2]: 1.0,
  [AWSRegion.US_WEST_1]: 1.03,
  [AWSRegion.US_WEST_2]: 1.0,
  [AWSRegion.CA_CENTRAL_1]: 1.0,
  [AWSRegion.SA_EAST_1]: 1.76,
  [AWSRegion.US_GOV_WEST_1]: 1.22,
  [AWSRegion.EU_CENTRAL_1]: 1.02,
  [AWSRegion.EU_WEST_1]: 1.0,
  [AWSRegion.EU_WEST_2]: 1.02,
  [AWSRegion.EU_NORTH_1]: 1.0,
  [AWSRegion.AP_NORTHEAST_1]: 1.05,
  [AWSRegion.AP_SOUTHEAST_1]: 1.05,
  [AWSRegion.AP_SOUTH_1]: 1.08,
  [AWSRegion.AP_SOUTHEAST_2]: 1.05,
};

export const EOZ_REGIONS: AWSRegion[] = [
  AWSRegion.US_EAST_1,
  AWSRegion.US_EAST_2,
  AWSRegion.US_WEST_2,
  AWSRegion.AP_SOUTH_1,
  AWSRegion.AP_NORTHEAST_1,
  AWSRegion.EU_WEST_1,
  AWSRegion.EU_NORTH_1,
];

export const REGION_LABELS: Record<AWSRegion, string> = {
  [AWSRegion.US_EAST_1]: "US East (N. Virginia)",
  [AWSRegion.US_EAST_2]: "US East (Ohio)",
  [AWSRegion.US_WEST_1]: "US West (N. California)",
  [AWSRegion.US_WEST_2]: "US West (Oregon)",
  [AWSRegion.CA_CENTRAL_1]: "Canada (Central)",
  [AWSRegion.SA_EAST_1]: "South America (São Paulo)",
  [AWSRegion.US_GOV_WEST_1]: "AWS GovCloud (US-West)",
  [AWSRegion.EU_CENTRAL_1]: "Europe (Frankfurt)",
  [AWSRegion.EU_WEST_1]: "Europe (Ireland)",
  [AWSRegion.EU_WEST_2]: "Europe (London)",
  [AWSRegion.EU_NORTH_1]: "Europe (Stockholm)",
  [AWSRegion.AP_NORTHEAST_1]: "Asia Pacific (Tokyo)",
  [AWSRegion.AP_SOUTHEAST_1]: "Asia Pacific (Singapore)",
  [AWSRegion.AP_SOUTH_1]: "Asia Pacific (Mumbai)",
  [AWSRegion.AP_SOUTHEAST_2]: "Asia Pacific (Sydney)",
};

export const STORAGE_CLASS_LABELS: Record<StorageClass, string> = {
  [StorageClass.EXPRESS_ONE_ZONE]: "S3 Express One Zone",
  [StorageClass.STANDARD]: "S3 Standard",
  [StorageClass.INTELLIGENT_TIERING]: "S3 Intelligent-Tiering",
  [StorageClass.STANDARD_IA]: "S3 Standard-IA",
  [StorageClass.ONE_ZONE_IA]: "S3 One Zone-IA",
  [StorageClass.GLACIER_INSTANT]: "S3 Glacier Instant Retrieval",
  [StorageClass.GLACIER_FLEXIBLE]: "S3 Glacier Flexible Retrieval",
  [StorageClass.GLACIER_DEEP_ARCHIVE]: "S3 Glacier Deep Archive",
};

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
  [StorageClass.REDUCED_REDUNDANCY]: {
    storagePerGB: 0.024,
    putPer1K: 0.005,
    getPer1K: 0.0004,
    retrievalPerGB: 0,
    transitionPer1K: 0,
    minDurationDays: 0,
    minObjectSizeKB: 0,
    monitoringPer1KObjects: 0,
    availableRegions: "all",
    isDeprecated: true,
    deprecationNote:
      "AWS deprecated RRS. It offers lower durability than Standard at similar cost. Migrate to S3 Standard or Standard-IA.",
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
  archiveAccess: 0.0036,
  deepArchiveAccess: 0.00099,
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
  { perGB: number; per1KRequests: number }
> = {
  standard: { perGB: 0.02, per1KRequests: 0.0004 },
  bulk: { perGB: 0.0025, per1KRequests: 0.0 },
};

export const REGIONAL_MULTIPLIERS: Record<AWSRegion, number> = {
  // North America
  [AWSRegion.US_EAST_1]: 1.0,
  [AWSRegion.US_EAST_2]: 1.0,
  [AWSRegion.US_WEST_1]: 1.03,
  [AWSRegion.US_WEST_2]: 1.0,
  [AWSRegion.CA_CENTRAL_1]: 1.0,
  [AWSRegion.CA_WEST_1]: 1.03,
  [AWSRegion.MX_CENTRAL_1]: 1.08,
  // South America
  [AWSRegion.SA_EAST_1]: 1.76,
  // Europe
  [AWSRegion.EU_CENTRAL_1]: 1.02,
  [AWSRegion.EU_CENTRAL_2]: 1.08,
  [AWSRegion.EU_WEST_1]: 1.0,
  [AWSRegion.EU_WEST_2]: 1.02,
  [AWSRegion.EU_WEST_3]: 1.02,
  [AWSRegion.EU_SOUTH_1]: 1.05,
  [AWSRegion.EU_SOUTH_2]: 1.03,
  [AWSRegion.EU_NORTH_1]: 1.0,
  // Africa
  [AWSRegion.AF_SOUTH_1]: 1.15,
  // Middle East
  [AWSRegion.ME_CENTRAL_1]: 1.18,
  [AWSRegion.ME_SOUTH_1]: 1.15,
  [AWSRegion.IL_CENTRAL_1]: 1.15,
  // Asia Pacific
  [AWSRegion.AP_NORTHEAST_1]: 1.05,
  [AWSRegion.AP_NORTHEAST_2]: 1.05,
  [AWSRegion.AP_NORTHEAST_3]: 1.05,
  [AWSRegion.AP_SOUTHEAST_1]: 1.05,
  [AWSRegion.AP_SOUTHEAST_2]: 1.05,
  [AWSRegion.AP_SOUTHEAST_3]: 1.10,
  [AWSRegion.AP_SOUTHEAST_4]: 1.08,
  [AWSRegion.AP_SOUTHEAST_5]: 1.08,
  [AWSRegion.AP_SOUTHEAST_7]: 1.08,
  [AWSRegion.AP_EAST_1]: 1.10,
  [AWSRegion.AP_SOUTH_1]: 1.08,
  // GovCloud
  [AWSRegion.US_GOV_WEST_1]: 1.22,
  [AWSRegion.US_GOV_EAST_1]: 1.22,
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
  // North America
  [AWSRegion.US_EAST_1]: "US East (N. Virginia)",
  [AWSRegion.US_EAST_2]: "US East (Ohio)",
  [AWSRegion.US_WEST_1]: "US West (N. California)",
  [AWSRegion.US_WEST_2]: "US West (Oregon)",
  [AWSRegion.CA_CENTRAL_1]: "Canada (Central)",
  [AWSRegion.CA_WEST_1]: "Canada (West)",
  [AWSRegion.MX_CENTRAL_1]: "Mexico (Central)",
  // South America
  [AWSRegion.SA_EAST_1]: "South America (São Paulo)",
  // Europe
  [AWSRegion.EU_CENTRAL_1]: "Europe (Frankfurt)",
  [AWSRegion.EU_CENTRAL_2]: "Europe (Zurich)",
  [AWSRegion.EU_WEST_1]: "Europe (Ireland)",
  [AWSRegion.EU_WEST_2]: "Europe (London)",
  [AWSRegion.EU_WEST_3]: "Europe (Paris)",
  [AWSRegion.EU_SOUTH_1]: "Europe (Milan)",
  [AWSRegion.EU_SOUTH_2]: "Europe (Spain)",
  [AWSRegion.EU_NORTH_1]: "Europe (Stockholm)",
  // Africa
  [AWSRegion.AF_SOUTH_1]: "Africa (Cape Town)",
  // Middle East
  [AWSRegion.ME_CENTRAL_1]: "Middle East (UAE)",
  [AWSRegion.ME_SOUTH_1]: "Middle East (Bahrain)",
  [AWSRegion.IL_CENTRAL_1]: "Israel (Tel Aviv)",
  // Asia Pacific
  [AWSRegion.AP_NORTHEAST_1]: "Asia Pacific (Tokyo)",
  [AWSRegion.AP_NORTHEAST_2]: "Asia Pacific (Seoul)",
  [AWSRegion.AP_NORTHEAST_3]: "Asia Pacific (Osaka)",
  [AWSRegion.AP_SOUTHEAST_1]: "Asia Pacific (Singapore)",
  [AWSRegion.AP_SOUTHEAST_2]: "Asia Pacific (Sydney)",
  [AWSRegion.AP_SOUTHEAST_3]: "Asia Pacific (Jakarta)",
  [AWSRegion.AP_SOUTHEAST_4]: "Asia Pacific (New Zealand)",
  [AWSRegion.AP_SOUTHEAST_5]: "Asia Pacific (Malaysia)",
  [AWSRegion.AP_SOUTHEAST_7]: "Asia Pacific (Thailand)",
  [AWSRegion.AP_EAST_1]: "Asia Pacific (Hong Kong)",
  [AWSRegion.AP_SOUTH_1]: "Asia Pacific (Mumbai)",
  // GovCloud
  [AWSRegion.US_GOV_WEST_1]: "AWS GovCloud (US-West)",
  [AWSRegion.US_GOV_EAST_1]: "AWS GovCloud (US-East)",
};

export function calculateTieredStandardStorageCost(storageGB: number): number {
  const tier1CapGB = 50 * 1024;     // 50 TB
  const tier2CapGB = 500 * 1024;    // 500 TB

  if (storageGB <= tier1CapGB) {
    return storageGB * 0.023;
  } else if (storageGB <= tier2CapGB) {
    return tier1CapGB * 0.023 + (storageGB - tier1CapGB) * 0.022;
  } else {
    return tier1CapGB * 0.023
      + (tier2CapGB - tier1CapGB) * 0.022
      + (storageGB - tier2CapGB) * 0.021;
  }
}

export function calculateDataTransferOutCost(gb: number): number {
  if (gb <= 100) return 0;
  const billable = gb - 100;
  const t1 = 10 * 1024;    // 10 TB
  const t2 = 50 * 1024;    // 50 TB
  const t3 = 150 * 1024;   // 150 TB

  if (billable <= t1) return billable * 0.09;
  if (billable <= t2) return t1 * 0.09 + (billable - t1) * 0.085;
  if (billable <= t3) return t1 * 0.09 + (t2 - t1) * 0.085 + (billable - t2) * 0.07;
  return t1 * 0.09 + (t2 - t1) * 0.085 + (t3 - t2) * 0.07 + (billable - t3) * 0.05;
}

export type RegionGroup = {
  label: string;
  regions: AWSRegion[];
};

export const REGION_GROUPS: RegionGroup[] = [
  {
    label: "North America",
    regions: [
      AWSRegion.US_EAST_1,
      AWSRegion.US_EAST_2,
      AWSRegion.US_WEST_1,
      AWSRegion.US_WEST_2,
      AWSRegion.CA_CENTRAL_1,
      AWSRegion.CA_WEST_1,
      AWSRegion.MX_CENTRAL_1,
    ],
  },
  {
    label: "South America",
    regions: [AWSRegion.SA_EAST_1],
  },
  {
    label: "Europe",
    regions: [
      AWSRegion.EU_CENTRAL_1,
      AWSRegion.EU_CENTRAL_2,
      AWSRegion.EU_WEST_1,
      AWSRegion.EU_WEST_2,
      AWSRegion.EU_WEST_3,
      AWSRegion.EU_SOUTH_1,
      AWSRegion.EU_SOUTH_2,
      AWSRegion.EU_NORTH_1,
    ],
  },
  {
    label: "Africa",
    regions: [AWSRegion.AF_SOUTH_1],
  },
  {
    label: "Middle East",
    regions: [
      AWSRegion.ME_CENTRAL_1,
      AWSRegion.ME_SOUTH_1,
      AWSRegion.IL_CENTRAL_1,
    ],
  },
  {
    label: "Asia Pacific",
    regions: [
      AWSRegion.AP_NORTHEAST_1,
      AWSRegion.AP_NORTHEAST_2,
      AWSRegion.AP_NORTHEAST_3,
      AWSRegion.AP_SOUTHEAST_1,
      AWSRegion.AP_SOUTHEAST_2,
      AWSRegion.AP_SOUTHEAST_3,
      AWSRegion.AP_SOUTHEAST_4,
      AWSRegion.AP_SOUTHEAST_5,
      AWSRegion.AP_SOUTHEAST_7,
      AWSRegion.AP_EAST_1,
      AWSRegion.AP_SOUTH_1,
    ],
  },
  {
    label: "GovCloud",
    regions: [AWSRegion.US_GOV_WEST_1, AWSRegion.US_GOV_EAST_1],
  },
];

export const STORAGE_CLASS_LABELS: Record<StorageClass, string> = {
  [StorageClass.EXPRESS_ONE_ZONE]: "S3 Express One Zone",
  [StorageClass.STANDARD]: "S3 Standard",
  [StorageClass.INTELLIGENT_TIERING]: "S3 Intelligent-Tiering",
  [StorageClass.STANDARD_IA]: "S3 Standard-IA",
  [StorageClass.ONE_ZONE_IA]: "S3 One Zone-IA",
  [StorageClass.GLACIER_INSTANT]: "S3 Glacier Instant Retrieval",
  [StorageClass.GLACIER_FLEXIBLE]: "S3 Glacier Flexible Retrieval",
  [StorageClass.GLACIER_DEEP_ARCHIVE]: "S3 Glacier Deep Archive",
  [StorageClass.REDUCED_REDUNDANCY]: "S3 Reduced Redundancy (Deprecated)",
};

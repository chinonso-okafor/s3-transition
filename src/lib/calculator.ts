import {
  StorageClass,
  AWSRegion,
  CalculatorInputs,
  CalculatorOutput,
  StorageClassResult,
  EOZResult,
  SensitivityScenario,
  AccessPatternConfidence,
  GlacierRetrievalTier,
} from "@/types";

import {
  PRICING,
  EOZ_PRICING,
  INTELLIGENT_TIERING_STORAGE_RATES,
  GLACIER_RETRIEVAL_COSTS,
  DEEP_ARCHIVE_RETRIEVAL_COSTS,
  REGIONAL_MULTIPLIERS,
  EOZ_REGIONS,
  calculateTieredStandardStorageCost,
  calculateDataTransferOutCost,
} from "@/lib/pricing";

// --- Derived Values ---

export function calcAvgObjectSizeKB(
  storageGB: number,
  objectCount: number
): number {
  if (objectCount === 0) return 0;
  return (storageGB * 1_048_576) / objectCount;
}

export function calcBilledStorageGB_IA(
  storageGB: number,
  objectCount: number,
  avgObjectSizeKB: number
): number {
  if (avgObjectSizeKB < 128) {
    return (objectCount * 128) / 1_048_576;
  }
  return storageGB;
}

export function calcBilledStorageGB_Glacier(
  storageGB: number,
  objectCount: number
): number {
  return storageGB + (objectCount * 40) / 1_048_576;
}

export function getRegionalMultiplier(region: AWSRegion): number {
  return REGIONAL_MULTIPLIERS[region];
}

export function isEOZEligible(region: AWSRegion): boolean {
  return EOZ_REGIONS.includes(region);
}

// --- Monthly TCO per storage class ---

function getRetrievalCostPerGB(
  storageClass: StorageClass,
  glacierRetrievalTier: GlacierRetrievalTier
): number {
  if (storageClass === StorageClass.GLACIER_FLEXIBLE) {
    return GLACIER_RETRIEVAL_COSTS[glacierRetrievalTier].perGB;
  }
  if (storageClass === StorageClass.GLACIER_DEEP_ARCHIVE) {
    const tier = glacierRetrievalTier === "expedited" ? "standard" : glacierRetrievalTier;
    return DEEP_ARCHIVE_RETRIEVAL_COSTS[tier].perGB;
  }
  return PRICING[storageClass].retrievalPerGB;
}

function getRetrievalRequestCostPer1K(
  storageClass: StorageClass,
  glacierRetrievalTier: GlacierRetrievalTier
): number {
  if (storageClass === StorageClass.GLACIER_FLEXIBLE) {
    return GLACIER_RETRIEVAL_COSTS[glacierRetrievalTier].per1KRequests;
  }
  return 0;
}

function getBilledStorageGB(
  storageClass: StorageClass,
  storageGB: number,
  objectCount: number,
  avgObjectSizeKB: number
): number {
  if (
    storageClass === StorageClass.STANDARD_IA ||
    storageClass === StorageClass.ONE_ZONE_IA ||
    storageClass === StorageClass.GLACIER_INSTANT
  ) {
    return calcBilledStorageGB_IA(storageGB, objectCount, avgObjectSizeKB);
  }
  if (
    storageClass === StorageClass.GLACIER_FLEXIBLE ||
    storageClass === StorageClass.GLACIER_DEEP_ARCHIVE
  ) {
    return calcBilledStorageGB_Glacier(storageGB, objectCount);
  }
  return storageGB;
}

function calcITBlendedStorageRate(
  accessPatternConfidence: AccessPatternConfidence,
  monthlyGetRequests: number,
  storageGB: number,
  itArchiveTiersEnabled: boolean
): number {
  const rates = INTELLIGENT_TIERING_STORAGE_RATES;

  if (itArchiveTiersEnabled) {
    let freqPct: number;
    let infreqPct: number;
    let archiveInstantPct: number;
    let archiveAccessPct: number;
    let deepArchiveAccessPct: number;

    if (accessPatternConfidence === "low") {
      freqPct = 0.6;
      infreqPct = 0.25;
      archiveInstantPct = 0.1;
      archiveAccessPct = 0.03;
      deepArchiveAccessPct = 0.02;
    } else if (accessPatternConfidence === "medium") {
      freqPct = 0.5;
      infreqPct = 0.3;
      archiveInstantPct = 0.12;
      archiveAccessPct = 0.05;
      deepArchiveAccessPct = 0.03;
    } else {
      freqPct = 0.4;
      infreqPct = 0.3;
      archiveInstantPct = 0.15;
      archiveAccessPct = 0.1;
      deepArchiveAccessPct = 0.05;
    }

    return (
      freqPct * rates.frequent +
      infreqPct * rates.infrequent +
      archiveInstantPct * rates.archiveInstant +
      archiveAccessPct * rates.archiveAccess +
      deepArchiveAccessPct * rates.deepArchiveAccess
    );
  }

  // Standard 3-tier distribution (archive tiers disabled)
  let freqPct: number;
  let infreqPct: number;
  let archivePct: number;

  if (accessPatternConfidence === "low") {
    freqPct = 0.7;
    infreqPct = 0.3;
    archivePct = 0;
  } else if (accessPatternConfidence === "medium") {
    freqPct = 0.5;
    infreqPct = 0.35;
    archivePct = 0.15;
  } else {
    // high confidence — check if mostly hot
    const accessRatio = storageGB > 0 ? monthlyGetRequests / (storageGB * 1000) : 0;
    if (accessRatio > 1) {
      freqPct = 0.9;
      infreqPct = 0.1;
      archivePct = 0;
    } else {
      freqPct = 0.5;
      infreqPct = 0.35;
      archivePct = 0.15;
    }
  }

  return (
    freqPct * rates.frequent +
    infreqPct * rates.infrequent +
    archivePct * rates.archiveInstant
  );
}

function calcITMonitoringEligibleObjects(
  objectCount: number,
  avgObjectSizeKB: number
): number {
  if (avgObjectSizeKB < 128) return 0;
  if (avgObjectSizeKB > 300) return objectCount * 0.95;
  // Linear interpolation between 128 and 300
  const fraction = (avgObjectSizeKB - 128) / (300 - 128);
  return objectCount * (fraction * 0.95);
}

export function calcMonthlyTCO(
  storageClass: StorageClass,
  inputs: CalculatorInputs,
  avgObjectSizeKB: number
): {
  storage: number;
  requests: number;
  retrieval: number;
  monitoring: number;
  dataTransfer: number;
  total: number;
} {
  const pricing = PRICING[storageClass];
  const regionalMultiplier = getRegionalMultiplier(inputs.region);

  let billedGB: number;
  let storageRate: number;

  if (storageClass === StorageClass.INTELLIGENT_TIERING) {
    billedGB = inputs.storageGB;
    storageRate = calcITBlendedStorageRate(
      inputs.accessPatternConfidence,
      inputs.monthlyGetRequests,
      inputs.storageGB,
      inputs.itArchiveTiersEnabled
    );
  } else {
    billedGB = getBilledStorageGB(
      storageClass,
      inputs.storageGB,
      inputs.objectCount,
      avgObjectSizeKB
    );
    storageRate = pricing.storagePerGB;
  }

  const storageCost = storageClass === StorageClass.STANDARD
    ? calculateTieredStandardStorageCost(billedGB)
    : billedGB * storageRate;

  const requestCost =
    (inputs.monthlyGetRequests / 1000) * pricing.getPer1K;

  const retrievalPerGB = getRetrievalCostPerGB(
    storageClass,
    inputs.glacierRetrievalTier
  );
  const retrievalRequestCost =
    getRetrievalRequestCostPer1K(storageClass, inputs.glacierRetrievalTier) > 0
      ? (inputs.monthlyGetRequests / 1000) *
        getRetrievalRequestCostPer1K(storageClass, inputs.glacierRetrievalTier)
      : 0;
  const retrievalCost =
    inputs.monthlyRetrievalGB * retrievalPerGB + retrievalRequestCost;

  let monitoringCost = 0;
  if (storageClass === StorageClass.INTELLIGENT_TIERING) {
    const eligible = calcITMonitoringEligibleObjects(
      inputs.objectCount,
      avgObjectSizeKB
    );
    monitoringCost = (eligible / 1000) * pricing.monitoringPer1KObjects;
  }

  // EOZ has an additional per-GB upload fee
  let uploadCost = 0;
  if (storageClass === StorageClass.EXPRESS_ONE_ZONE) {
    uploadCost = inputs.storageGB * EOZ_PRICING.uploadPerGB;
  }

  const dataTransferCost = calculateDataTransferOutCost(inputs.monthlyDataTransferOutGB ?? 0);

  const total =
    (storageCost + requestCost + retrievalCost + monitoringCost + uploadCost) *
    regionalMultiplier + dataTransferCost;

  return {
    storage: storageCost * regionalMultiplier,
    requests: (requestCost + uploadCost) * regionalMultiplier,
    retrieval: retrievalCost * regionalMultiplier,
    monitoring: monitoringCost * regionalMultiplier,
    dataTransfer: dataTransferCost,
    total,
  };
}

// --- Transition Cost ---

export function calcTransitionCost(
  currentClass: StorageClass,
  targetClass: StorageClass,
  objectCount: number,
  storageGB: number,
  regionalMultiplier: number
): number {
  if (targetClass === currentClass) return 0;

  if (targetClass === StorageClass.EXPRESS_ONE_ZONE) {
    const copyOutGet =
      (objectCount / 1000) * PRICING[currentClass].getPer1K;
    const copyInPut = (objectCount / 1000) * EOZ_PRICING.putPer1K;
    const uploadFee = storageGB * EOZ_PRICING.uploadPerGB;
    return (copyOutGet + copyInPut + uploadFee) * regionalMultiplier;
  }

  const targetPricing = PRICING[targetClass];
  return (objectCount / 1000) * targetPricing.transitionPer1K * regionalMultiplier;
}

// --- Minimum Duration Penalty ---

export function calcMinDurationPenalty(
  storageClass: StorageClass,
  retentionMonths: number,
  monthlyStorageCost: number
): number {
  const minDurationDays = PRICING[storageClass].minDurationDays;
  if (minDurationDays === 0) return 0;

  const retentionDays = retentionMonths * 30.44;
  if (retentionDays >= minDurationDays) return 0;

  const penaltyDays = minDurationDays - retentionDays;
  return (penaltyDays / 30.44) * monthlyStorageCost;
}

// --- Break-Even ---

export function calcBreakEven(
  currentMonthlyTCO: number,
  targetMonthlyTCO: number,
  transitionCost: number,
  minDurationPenalty: number
): {
  monthlySavings: number;
  breakEvenMonths: number | null;
  breakEvenDate: string | null;
  roi12Month: number | null;
} {
  const monthlySavings = currentMonthlyTCO - targetMonthlyTCO;

  if (monthlySavings <= 0) {
    return {
      monthlySavings,
      breakEvenMonths: null,
      breakEvenDate: null,
      roi12Month: null,
    };
  }

  const totalTransitionCost = transitionCost + minDurationPenalty;
  const breakEvenMonths =
    totalTransitionCost > 0 ? totalTransitionCost / monthlySavings : 0;

  const breakEvenDate = new Date();
  breakEvenDate.setMonth(breakEvenDate.getMonth() + Math.ceil(breakEvenMonths));
  const breakEvenDateStr = breakEvenDate.toISOString().split("T")[0];

  const roi12Month =
    totalTransitionCost > 0
      ? ((monthlySavings * 12 - totalTransitionCost) / totalTransitionCost) *
        100
      : null;

  return {
    monthlySavings,
    breakEvenMonths,
    breakEvenDate: breakEvenDateStr,
    roi12Month,
  };
}

// --- EOZ Result ---

export function calcEOZResult(
  inputs: CalculatorInputs,
  currentMonthlyTCO: number
): EOZResult | null {
  // Suppress EOZ card when user is already on EOZ or not on Standard
  if (
    inputs.currentClass !== StorageClass.STANDARD
  ) return null;

  const eligible = isEOZEligible(inputs.region);
  if (!eligible) {
    return {
      isEligible: false,
      ineligibleReason: `S3 Express One Zone is not available in ${inputs.region}`,
      monthlyCost: { storage: 0, upload: 0, retrieval: 0, requests: 0, total: 0 },
      premiumOverStandard: 0,
    };
  }

  const regionalMultiplier = getRegionalMultiplier(inputs.region);
  const storageCost = inputs.storageGB * EOZ_PRICING.storagePerGB * regionalMultiplier;
  const uploadCost = inputs.storageGB * EOZ_PRICING.uploadPerGB * regionalMultiplier;
  const retrievalCost =
    inputs.monthlyRetrievalGB * EOZ_PRICING.retrievalPerGB * regionalMultiplier;
  const requestCost =
    ((inputs.monthlyGetRequests / 1000) * EOZ_PRICING.getPer1K +
      (inputs.monthlyGetRequests / 1000) * EOZ_PRICING.putPer1K) *
    regionalMultiplier;

  const total = storageCost + uploadCost + retrievalCost + requestCost;

  return {
    isEligible: true,
    monthlyCost: {
      storage: storageCost,
      upload: uploadCost,
      retrieval: retrievalCost,
      requests: requestCost,
      total,
    },
    premiumOverStandard: total - currentMonthlyTCO,
  };
}

// --- Warnings ---

function generateWarnings(
  storageClass: StorageClass,
  inputs: CalculatorInputs,
  avgObjectSizeKB: number
): string[] {
  const warnings: string[] = [];

  if (
    avgObjectSizeKB < 128 &&
    (storageClass === StorageClass.STANDARD_IA ||
      storageClass === StorageClass.ONE_ZONE_IA ||
      storageClass === StorageClass.GLACIER_INSTANT)
  ) {
    const ratio = (128 / avgObjectSizeKB).toFixed(1);
    warnings.push(
      `Small object penalty: avg object size ${avgObjectSizeKB.toFixed(1)} KB is below 128 KB minimum. Billed at ${ratio}× actual volume.`
    );
  }

  if (
    inputs.isMutable &&
    (storageClass === StorageClass.STANDARD_IA ||
      storageClass === StorageClass.ONE_ZONE_IA ||
      storageClass === StorageClass.GLACIER_INSTANT ||
      storageClass === StorageClass.GLACIER_FLEXIBLE ||
      storageClass === StorageClass.GLACIER_DEEP_ARCHIVE)
  ) {
    warnings.push(
      "Mutable data warning: frequent overwrites/deletes on this class incur minimum duration charges and transition costs on each new object version."
    );
  }

  const minDurationDays = PRICING[storageClass].minDurationDays;
  if (minDurationDays > 0) {
    const retentionDays = inputs.retentionMonths * 30.44;
    if (retentionDays < minDurationDays) {
      warnings.push(
        `Minimum duration risk: retention of ${inputs.retentionMonths} months (${Math.round(retentionDays)} days) is below the ${minDurationDays}-day minimum. Early deletion penalty applies.`
      );
    }
  }

  // High object-count warning: transition costs may dominate savings
  if (inputs.storageGB > 0) {
    const objectsPerGB = inputs.objectCount / inputs.storageGB;
    if (objectsPerGB > 10000) {
      warnings.push(
        `High object density: ${Math.round(objectsPerGB).toLocaleString()} objects/GB detected. ` +
        `Lifecycle transition fees are charged per object — verify the transition cost shown ` +
        `in the break-even analysis before proceeding.`
      );
    }
  }

  if (
    storageClass === StorageClass.INTELLIGENT_TIERING &&
    avgObjectSizeKB < 128
  ) {
    warnings.push(
      "Intelligent-Tiering provides zero benefit for objects below 128 KB — all objects stay in Frequent Access tier permanently with no auto-tiering."
    );
  }

  // RRS deprecation warning
  if (
    storageClass === StorageClass.REDUCED_REDUNDANCY ||
    inputs.currentClass === StorageClass.REDUCED_REDUNDANCY
  ) {
    const rrsNote = PRICING[StorageClass.REDUCED_REDUNDANCY].deprecationNote;
    if (rrsNote) {
      warnings.push(rrsNote);
    }
  }

  return warnings;
}

// --- Sensitivity Analysis ---

function calcSensitivity(
  inputs: CalculatorInputs,
  avgObjectSizeKB: number,
  currentTCO: number
): SensitivityScenario[] {
  const multipliers = [
    { label: "Retrieval halved (0.5×)", multiplier: 0.5 },
    { label: "Retrieval doubled (2×)", multiplier: 2 },
    { label: "Retrieval tripled (3×)", multiplier: 3 },
  ];

  return multipliers.map(({ label, multiplier }) => {
    const modifiedInputs: CalculatorInputs = {
      ...inputs,
      monthlyRetrievalGB: inputs.monthlyRetrievalGB * multiplier,
      monthlyGetRequests: inputs.monthlyGetRequests * multiplier,
    };

    const candidateClasses = getCandidateClasses(inputs.currentClass);
    let bestClass = inputs.currentClass;
    let bestTCO = calcMonthlyTCO(
      inputs.currentClass,
      modifiedInputs,
      avgObjectSizeKB
    ).total;

    for (const sc of candidateClasses) {
      if (sc === StorageClass.EXPRESS_ONE_ZONE) continue;
      const tco = calcMonthlyTCO(sc, modifiedInputs, avgObjectSizeKB).total;
      if (tco < bestTCO) {
        bestTCO = tco;
        bestClass = sc;
      }
    }

    return {
      label,
      retrievalMultiplier: multiplier,
      recommendedClass: bestClass,
      monthlyTCO: bestTCO,
      monthlySavings: currentTCO - bestTCO,
    };
  });
}

// --- Candidate classes ---

function getCandidateClasses(currentClass: StorageClass): StorageClass[] {
  // Standard cost-optimization classes (never include EOZ or RRS in ranked list)
  return [
    StorageClass.STANDARD,
    StorageClass.INTELLIGENT_TIERING,
    StorageClass.STANDARD_IA,
    StorageClass.ONE_ZONE_IA,
    StorageClass.GLACIER_INSTANT,
    StorageClass.GLACIER_FLEXIBLE,
    StorageClass.GLACIER_DEEP_ARCHIVE,
  ].filter((sc) => sc !== currentClass);
}

// --- Main Calculator ---

export function calculate(inputs: CalculatorInputs): CalculatorOutput {
  const avgObjectSizeKB = calcAvgObjectSizeKB(
    inputs.storageGB,
    inputs.objectCount
  );
  const billedStorageGB_IA = calcBilledStorageGB_IA(
    inputs.storageGB,
    inputs.objectCount,
    avgObjectSizeKB
  );
  const billedStorageGB_Glacier = calcBilledStorageGB_Glacier(
    inputs.storageGB,
    inputs.objectCount
  );
  const regionalMultiplier = getRegionalMultiplier(inputs.region);
  const eozEligible = isEOZEligible(inputs.region);
  const smallObjectPenaltyActive = avgObjectSizeKB > 0 && avgObjectSizeKB < 128;
  const smallObjectInflationRatio = smallObjectPenaltyActive
    ? 128 / avgObjectSizeKB
    : null;

  // Calculate current class TCO
  const currentTCO = calcMonthlyTCO(
    inputs.currentClass,
    inputs,
    avgObjectSizeKB
  );

  // Calculate all candidate classes
  const candidateClasses = getCandidateClasses(inputs.currentClass);
  const results: StorageClassResult[] = [];

  // Add current class result
  results.push({
    storageClass: inputs.currentClass,
    monthlyCost: currentTCO,
    transitionCost: 0,
    minDurationPenalty: 0,
    monthlySavings: 0,
    breakEvenMonths: null,
    breakEvenDate: null,
    roi12Month: null,
    isRecommended: false,
    isEligible: true,
    warnings: generateWarnings(inputs.currentClass, inputs, avgObjectSizeKB),
  });

  for (const sc of candidateClasses) {
    if (sc === StorageClass.EXPRESS_ONE_ZONE) continue;

    const tco = calcMonthlyTCO(sc, inputs, avgObjectSizeKB);
    const transition = calcTransitionCost(
      inputs.currentClass,
      sc,
      inputs.objectCount,
      inputs.storageGB,
      regionalMultiplier
    );
    const penalty = calcMinDurationPenalty(
      sc,
      inputs.retentionMonths,
      tco.storage
    );
    const breakEven = calcBreakEven(
      currentTCO.total,
      tco.total,
      transition,
      penalty
    );

    results.push({
      storageClass: sc,
      monthlyCost: tco,
      transitionCost: transition,
      minDurationPenalty: penalty,
      monthlySavings: breakEven.monthlySavings,
      breakEvenMonths: breakEven.breakEvenMonths,
      breakEvenDate: breakEven.breakEvenDate,
      roi12Month: breakEven.roi12Month,
      isRecommended: false,
      isEligible: true,
      warnings: generateWarnings(sc, inputs, avgObjectSizeKB),
    });
  }

  // Sort by monthly TCO ascending
  results.sort((a, b) => a.monthlyCost.total - b.monthlyCost.total);

  // Async classes excluded from recommendation when immediate access required
  const asyncClasses = [StorageClass.GLACIER_FLEXIBLE, StorageClass.GLACIER_DEEP_ARCHIVE];
  const eligibleForRecommendation = (sc: StorageClass) =>
    inputs.requiresImmediateAccess ? !asyncClasses.includes(sc) : true;

  // Find recommendation: cheapest eligible class that isn't the current class and has positive savings
  const recommendation =
    results.find(
      (r) =>
        r.storageClass !== inputs.currentClass &&
        r.monthlySavings > 0 &&
        eligibleForRecommendation(r.storageClass)
    ) ?? null;

  if (recommendation) {
    recommendation.isRecommended = true;
  }

  // EOZ result
  const eozResult = calcEOZResult(inputs, currentTCO.total);

  // Sensitivity
  const sensitivityAnalysis = calcSensitivity(
    inputs,
    avgObjectSizeKB,
    currentTCO.total
  );

  // Global warnings
  const globalWarnings: string[] = [];
  if (smallObjectPenaltyActive) {
    globalWarnings.push(
      `Small object penalty active: average object size is ${avgObjectSizeKB.toFixed(1)} KB (below 128 KB). IA and Glacier Instant classes will bill at ${smallObjectInflationRatio!.toFixed(1)}× actual volume.`
    );
  }
  if (inputs.isMutable) {
    globalWarnings.push(
      "Data is mutable: frequent overwrites/deletes can trigger minimum duration charges on IA and Glacier classes."
    );
  }

  // High object-count: transition cost dominance check
  if (recommendation && recommendation.transitionCost > 0 && recommendation.monthlySavings > 0) {
    const objectsPerGB = inputs.objectCount / inputs.storageGB;
    const monthsToBreakEven = recommendation.breakEvenMonths;

    if (objectsPerGB > 10000 && monthsToBreakEven !== null && monthsToBreakEven > 6) {
      globalWarnings.push(
        `Transition cost dominance: with ${inputs.objectCount.toLocaleString()} objects, ` +
        `the one-time transition fee ($${recommendation.transitionCost.toFixed(2)}) takes ` +
        `${monthsToBreakEven.toFixed(1)} months to recover. For high object-count buckets, ` +
        `consider whether compacting small objects first would reduce transition costs.`
      );
    }
  }

  if (inputs.accessPatternConfidence === "low") {
    globalWarnings.push(
      "Low confidence in access pattern data: recommendation may change significantly with actual usage patterns. Consider Intelligent-Tiering for automatic optimization."
    );
  }
  if (!eozEligible && inputs.currentClass === StorageClass.STANDARD) {
    globalWarnings.push(
      `S3 Express One Zone is not available in ${inputs.region}.`
    );
  }
  if (inputs.itArchiveTiersEnabled) {
    globalWarnings.push(
      "Archive Access tiers require asynchronous retrieval (hours). Ensure your application can tolerate this before enabling."
    );
  }
  if (inputs.currentClass === StorageClass.REDUCED_REDUNDANCY) {
    const rrsNote = PRICING[StorageClass.REDUCED_REDUNDANCY].deprecationNote;
    if (rrsNote) {
      globalWarnings.push(rrsNote);
    }
  }

  // Determine overall confidence
  let confidenceLevel: AccessPatternConfidence =
    inputs.accessPatternConfidence;
  if (
    recommendation &&
    recommendation.monthlySavings > 0 &&
    recommendation.breakEvenMonths !== null &&
    recommendation.breakEvenMonths > 12
  ) {
    if (confidenceLevel === "high") confidenceLevel = "medium";
    else if (confidenceLevel === "medium") confidenceLevel = "low";
  }

  // RRS rationale augmentation
  if (
    inputs.currentClass === StorageClass.REDUCED_REDUNDANCY &&
    recommendation
  ) {
    recommendation.warnings = [
      "Your bucket is currently on Reduced Redundancy Storage, which AWS deprecated. Regardless of cost optimisation, migrating away from RRS is recommended.",
      ...recommendation.warnings,
    ];
  }

  return {
    inputs,
    derivedValues: {
      avgObjectSizeKB,
      billedStorageGB_IA,
      billedStorageGB_Glacier,
      regionalMultiplier,
      isEOZEligible: eozEligible,
      smallObjectPenaltyActive,
      smallObjectInflationRatio,
    },
    results,
    recommendation,
    eozResult,
    sensitivityAnalysis,
    warnings: globalWarnings,
    confidenceLevel,
  };
}

// --- Mixed Bucket TCO Calculation ---

export interface MixedBucketSegmentResult {
  storageClass: StorageClass;
  storageGB: number;
  objectCount: number;
  monthlyStorageCost: number;
}

export function calculateMixedBucketTCO(
  inputs: CalculatorInputs
): CalculatorOutput | null {
  const { mixedSegments, objectCount } = inputs;

  // Validation: at least 2 segments, no zero-or-negative storageGB
  if (mixedSegments.length < 2) return null;
  if (mixedSegments.some((s) => s.storageGB <= 0)) return null;

  const totalStorageGB = mixedSegments.reduce(
    (sum, s) => sum + s.storageGB,
    0
  );

  // Calculate proportional object count per segment
  const segmentDetails = mixedSegments.map((seg) => {
    const proportion = seg.storageGB / totalStorageGB;
    const segObjectCount = Math.round(objectCount * proportion);
    return { ...seg, objectCount: segObjectCount };
  });

  // Calculate current cost per segment (storage costs only, per-class)
  let currentTotalMonthlyTCO = 0;
  const segmentResults: MixedBucketSegmentResult[] = [];
  const allWarnings: string[] = [];

  for (const seg of segmentDetails) {
    const segAvgObjSize = calcAvgObjectSizeKB(seg.storageGB, seg.objectCount);
    const segInputs: CalculatorInputs = {
      ...inputs,
      storageGB: seg.storageGB,
      objectCount: seg.objectCount,
      currentClass: seg.storageClass,
    };
    const segTCO = calcMonthlyTCO(seg.storageClass, segInputs, segAvgObjSize);
    currentTotalMonthlyTCO += segTCO.total;

    segmentResults.push({
      storageClass: seg.storageClass,
      storageGB: seg.storageGB,
      objectCount: seg.objectCount,
      monthlyStorageCost: segTCO.storage,
    });

    // Collect per-segment warnings
    const segWarnings = generateWarningsForMixed(
      seg.storageClass,
      segInputs,
      segAvgObjSize
    );
    for (const w of segWarnings) {
      if (!allWarnings.includes(w)) allWarnings.push(w);
    }
  }

  // But request costs and retrieval costs are at the bucket level, not per segment.
  // The per-segment calcMonthlyTCO already includes requests and retrieval per segment,
  // which double-counts. We need to recalculate correctly:
  // - Storage costs: sum of per-segment storage costs
  // - Request costs: applied once at bucket level using total storage
  // - Retrieval costs: applied once at bucket level
  // Actually, looking at the spec more carefully: Step 3 says "For each segment, call
  // calculateStorageClassTCO... Pass through all other inputs unchanged including monthly GETs,
  // monthly retrieval GB". This means the monthly GETs and retrieval GB are passed per-segment
  // (same values), so each segment gets the full request + retrieval costs applied.
  //
  // But Step 3 also says "request costs applied at bucket level not per segment" in the test table.
  // This means we need to handle it differently: storage costs per segment, but request and
  // retrieval costs applied once using the dominant/overall bucket pricing.
  //
  // Re-reading spec more carefully: the tests say "request costs applied at bucket level not per
  // segment" and "retrieval costs applied at bucket level". So the correct approach is:
  // - Storage cost = sum of per-segment storage costs
  // - Request cost = bucket-level (using current class pricing for the total)
  // - Retrieval cost = bucket-level (using current class pricing for the total)
  //
  // For the "current" mixed bucket cost, we need to compute storage per segment but
  // requests and retrieval at bucket level. Let's recalculate.

  const avgObjectSizeKB = calcAvgObjectSizeKB(totalStorageGB, objectCount);
  const regionalMultiplier = getRegionalMultiplier(inputs.region);

  // Recalculate: storage per-segment, requests + retrieval at bucket level
  let totalStorageCost = 0;
  for (const seg of segmentDetails) {
    const segAvgObjSize = calcAvgObjectSizeKB(seg.storageGB, seg.objectCount);
    const billedGB = getBilledStorageGBPublic(
      seg.storageClass,
      seg.storageGB,
      seg.objectCount,
      segAvgObjSize
    );
    let storageRate: number;
    if (seg.storageClass === StorageClass.INTELLIGENT_TIERING) {
      storageRate = calcITBlendedStorageRate(
        inputs.accessPatternConfidence,
        inputs.monthlyGetRequests,
        seg.storageGB,
        inputs.itArchiveTiersEnabled
      );
    } else if (seg.storageClass === StorageClass.STANDARD) {
      totalStorageCost += calculateTieredStandardStorageCost(billedGB) * regionalMultiplier;
      continue;
    } else {
      storageRate = PRICING[seg.storageClass].storagePerGB;
    }
    totalStorageCost += billedGB * storageRate * regionalMultiplier;
  }

  // Request and retrieval costs: use a weighted approach based on the dominant class
  // Actually, for mixed bucket the "current" request cost should reflect the actual mix.
  // The simplest correct approach: weight request/retrieval costs by segment proportion.
  let totalRequestCost = 0;
  let totalRetrievalCost = 0;
  for (const seg of segmentDetails) {
    const proportion = seg.storageGB / totalStorageGB;
    const pricing = PRICING[seg.storageClass];
    totalRequestCost +=
      (inputs.monthlyGetRequests / 1000) * pricing.getPer1K * proportion;
    const retrievalPerGB = getRetrievalCostPerGBPublic(
      seg.storageClass,
      inputs.glacierRetrievalTier
    );
    totalRetrievalCost += inputs.monthlyRetrievalGB * retrievalPerGB * proportion;
  }
  totalRequestCost *= regionalMultiplier;
  totalRetrievalCost *= regionalMultiplier;

  // IT monitoring cost for IT segments
  let totalMonitoringCost = 0;
  for (const seg of segmentDetails) {
    if (seg.storageClass === StorageClass.INTELLIGENT_TIERING) {
      const segAvgObj = calcAvgObjectSizeKB(seg.storageGB, seg.objectCount);
      const eligible = calcITMonitoringEligibleObjects(
        seg.objectCount,
        segAvgObj
      );
      totalMonitoringCost +=
        (eligible / 1000) *
        PRICING[StorageClass.INTELLIGENT_TIERING].monitoringPer1KObjects *
        regionalMultiplier;
    }
  }

  currentTotalMonthlyTCO =
    totalStorageCost + totalRequestCost + totalRetrievalCost + totalMonitoringCost;

  // Now run the standard recommendation engine against total inputs
  const consolidatedInputs: CalculatorInputs = {
    ...inputs,
    storageGB: totalStorageGB,
    objectCount,
    currentClass: StorageClass.STANDARD, // placeholder for candidate generation
    bucketMode: "single",
  };

  // Calculate all candidate classes against total inputs
  const candidateClasses = [
    StorageClass.STANDARD,
    StorageClass.INTELLIGENT_TIERING,
    StorageClass.STANDARD_IA,
    StorageClass.ONE_ZONE_IA,
    StorageClass.GLACIER_INSTANT,
    StorageClass.GLACIER_FLEXIBLE,
    StorageClass.GLACIER_DEEP_ARCHIVE,
  ];

  const results: StorageClassResult[] = [];

  for (const sc of candidateClasses) {
    const tco = calcMonthlyTCO(sc, consolidatedInputs, avgObjectSizeKB);

    // Transition cost: sum of per-segment transitions to the target
    let transitionCost = 0;
    for (const seg of segmentDetails) {
      if (seg.storageClass !== sc) {
        transitionCost += calcTransitionCost(
          seg.storageClass,
          sc,
          seg.objectCount,
          seg.storageGB,
          regionalMultiplier
        );
      }
    }

    const penalty = calcMinDurationPenalty(
      sc,
      inputs.retentionMonths,
      tco.storage
    );
    const breakEven = calcBreakEven(
      currentTotalMonthlyTCO,
      tco.total,
      transitionCost,
      penalty
    );

    results.push({
      storageClass: sc,
      monthlyCost: tco,
      transitionCost,
      minDurationPenalty: penalty,
      monthlySavings: breakEven.monthlySavings,
      breakEvenMonths: breakEven.breakEvenMonths,
      breakEvenDate: breakEven.breakEvenDate,
      roi12Month: breakEven.roi12Month,
      isRecommended: false,
      isEligible: true,
      warnings: generateWarningsForMixed(sc, consolidatedInputs, avgObjectSizeKB),
    });
  }

  // Sort by monthly TCO ascending
  results.sort((a, b) => a.monthlyCost.total - b.monthlyCost.total);

  // Async classes excluded from recommendation when immediate access required
  const asyncClassesMixed = [StorageClass.GLACIER_FLEXIBLE, StorageClass.GLACIER_DEEP_ARCHIVE];
  const eligibleForRecommendationMixed = (sc: StorageClass) =>
    inputs.requiresImmediateAccess ? !asyncClassesMixed.includes(sc) : true;

  // Find recommendation: cheapest eligible class with positive savings
  const recommendation =
    results.find((r) => r.monthlySavings > 0 && eligibleForRecommendationMixed(r.storageClass)) ?? null;

  if (recommendation) {
    recommendation.isRecommended = true;
  }

  // IT-dominant bucket logic (Section 3.2)
  const itSegments = mixedSegments.filter(
    (s) => s.storageClass === StorageClass.INTELLIGENT_TIERING
  );
  const itStorageGB = itSegments.reduce((sum, s) => sum + s.storageGB, 0);
  const isITDominant = itStorageGB > totalStorageGB * 0.5;

  if (isITDominant) {
    // Calculate total IT monitoring fee
    const itMonitoringFee =
      (objectCount / 1000) * 0.0025;

    // Calculate estimated tiering saving
    const standardRate = PRICING[StorageClass.STANDARD].storagePerGB;
    const itBlendedRate = calcITBlendedStorageRate(
      inputs.accessPatternConfidence,
      inputs.monthlyGetRequests,
      itStorageGB,
      inputs.itArchiveTiersEnabled
    );
    const tieringSaving = (standardRate - itBlendedRate) * itStorageGB * regionalMultiplier;

    if (itMonitoringFee > tieringSaving) {
      allWarnings.push(
        `Intelligent-Tiering monitoring fee ($${itMonitoringFee.toFixed(2)}/month) exceeds estimated tiering savings ($${tieringSaving.toFixed(2)}/month) based on your object count and confidence level. Standard or a direct Glacier class may be more cost-effective.`
      );
    }

    // Compare Glacier Instant vs IT current TCO
    const glacierInstantResult = results.find(
      (r) => r.storageClass === StorageClass.GLACIER_INSTANT
    );
    if (
      glacierInstantResult &&
      glacierInstantResult.monthlyCost.total < currentTotalMonthlyTCO
    ) {
      allWarnings.push(
        "Moving from Intelligent-Tiering to Glacier Instant Retrieval removes automatic tiering. Objects in Archive Instant Access currently have no retrieval charges. Glacier Instant charges $0.03 per GB retrieved. Verify your actual retrieval volume before transitioning."
      );
    }

    // If IT is cheapest, recommend staying
    const itResult = results.find(
      (r) => r.storageClass === StorageClass.INTELLIGENT_TIERING
    );
    if (itResult && results[0]?.storageClass === StorageClass.INTELLIGENT_TIERING) {
      // IT is already the cheapest — if it's also cheaper than current, recommend it
      // Otherwise no savings possible
    }
  }

  // Sensitivity analysis
  const sensitivityAnalysis = calcSensitivity(
    consolidatedInputs,
    avgObjectSizeKB,
    currentTotalMonthlyTCO
  );

  // Global warnings
  const billedStorageGB_IA = calcBilledStorageGB_IA(
    totalStorageGB,
    objectCount,
    avgObjectSizeKB
  );
  const billedStorageGB_Glacier = calcBilledStorageGB_Glacier(
    totalStorageGB,
    objectCount
  );
  const smallObjectPenaltyActive =
    avgObjectSizeKB > 0 && avgObjectSizeKB < 128;
  const smallObjectInflationRatio = smallObjectPenaltyActive
    ? 128 / avgObjectSizeKB
    : null;

  if (smallObjectPenaltyActive) {
    allWarnings.push(
      `Small object penalty active: average object size is ${avgObjectSizeKB.toFixed(1)} KB (below 128 KB). IA and Glacier Instant classes will bill at ${smallObjectInflationRatio!.toFixed(1)}× actual volume.`
    );
  }
  if (inputs.isMutable) {
    allWarnings.push(
      "Data is mutable: frequent overwrites/deletes can trigger minimum duration charges on IA and Glacier classes."
    );
  }
  if (inputs.accessPatternConfidence === "low") {
    allWarnings.push(
      "Low confidence in access pattern data: recommendation may change significantly with actual usage patterns. Consider Intelligent-Tiering for automatic optimization."
    );
  }

  // Confidence level
  let confidenceLevel: AccessPatternConfidence =
    inputs.accessPatternConfidence;
  if (
    recommendation &&
    recommendation.monthlySavings > 0 &&
    recommendation.breakEvenMonths !== null &&
    recommendation.breakEvenMonths > 12
  ) {
    if (confidenceLevel === "high") confidenceLevel = "medium";
    else if (confidenceLevel === "medium") confidenceLevel = "low";
  }

  return {
    inputs: { ...inputs, storageGB: totalStorageGB },
    derivedValues: {
      avgObjectSizeKB,
      billedStorageGB_IA,
      billedStorageGB_Glacier,
      regionalMultiplier,
      isEOZEligible: false, // EOZ suppressed in mixed mode
      smallObjectPenaltyActive,
      smallObjectInflationRatio,
    },
    results,
    recommendation,
    eozResult: null, // EOZ suppressed in mixed mode
    sensitivityAnalysis,
    warnings: allWarnings,
    confidenceLevel,
  };
}

// Public wrappers for internal functions used by mixed bucket calculation
function getBilledStorageGBPublic(
  storageClass: StorageClass,
  storageGB: number,
  objectCount: number,
  avgObjectSizeKB: number
): number {
  return getBilledStorageGB(storageClass, storageGB, objectCount, avgObjectSizeKB);
}

function getRetrievalCostPerGBPublic(
  storageClass: StorageClass,
  glacierRetrievalTier: GlacierRetrievalTier
): number {
  return getRetrievalCostPerGB(storageClass, glacierRetrievalTier);
}

function generateWarningsForMixed(
  storageClass: StorageClass,
  inputs: CalculatorInputs,
  avgObjectSizeKB: number
): string[] {
  return generateWarnings(storageClass, inputs, avgObjectSizeKB);
}

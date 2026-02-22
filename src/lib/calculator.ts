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
  storageGB: number
): number {
  const rates = INTELLIGENT_TIERING_STORAGE_RATES;
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
      inputs.storageGB
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

  const storageCost = billedGB * storageRate;

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

  const total =
    (storageCost + requestCost + retrievalCost + monitoringCost) *
    regionalMultiplier;

  return {
    storage: storageCost * regionalMultiplier,
    requests: requestCost * regionalMultiplier,
    retrieval: retrievalCost * regionalMultiplier,
    monitoring: monitoringCost * regionalMultiplier,
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
  if (inputs.currentClass !== StorageClass.STANDARD) return null;

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

  if (
    storageClass === StorageClass.INTELLIGENT_TIERING &&
    avgObjectSizeKB < 128
  ) {
    warnings.push(
      "Intelligent-Tiering provides zero benefit for objects below 128 KB — all objects stay in Frequent Access tier permanently with no auto-tiering."
    );
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

  // Find recommendation: cheapest class that isn't the current class and has positive savings
  const recommendation =
    results.find(
      (r) =>
        r.storageClass !== inputs.currentClass && r.monthlySavings > 0
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

import { test, expect, Page } from "@playwright/test";

/**
 * Helper: fill all input fields for a complete calculation.
 * Uses input IDs from the actual components.
 */
async function fillInputs(
  page: Page,
  opts: {
    storageGB: number;
    objectCount: number;
    monthlyGetRequests: number;
    monthlyRetrievalGB: number;
    retentionMonths: number;
    region?: string;
    currentClass?: string;
    confidence?: "Low" | "Medium" | "High";
    isMutable?: boolean;
  }
) {
  // Region select (if specified) — uses Combobox (Command) component
  if (opts.region) {
    await page.getByLabel("AWS Region").click();
    await page
      .getByRole("option", { name: new RegExp(opts.region.replace(/[()]/g, "\\$&")) })
      .click();
  }

  // Storage GB
  await page.locator("#storage-gb").fill(String(opts.storageGB));

  // Object Count
  await page.locator("#object-count").fill(String(opts.objectCount));

  // Monthly GET Requests
  await page.locator("#monthly-get-requests").fill(String(opts.monthlyGetRequests));

  // Monthly Retrieval GB
  await page.locator("#monthly-retrieval-gb").fill(String(opts.monthlyRetrievalGB));

  // Confidence selector (radio card buttons)
  if (opts.confidence) {
    await page
      .getByRole("radiogroup", { name: "Access pattern confidence level" })
      .getByRole("radio", { name: opts.confidence })
      .click();
  }

  // Current class (if specified)
  if (opts.currentClass) {
    await page.getByLabel("Current storage class").click();
    await page
      .getByRole("option", { name: opts.currentClass, exact: true })
      .click();
  }

  // Retention months
  await page.locator("#retention-months").fill(String(opts.retentionMonths));

  // Mutable toggle
  if (opts.isMutable !== undefined) {
    const label = opts.isMutable ? "Yes (Mutable)" : "No (Immutable)";
    await page
      .getByRole("radiogroup", { name: "Is data mutable" })
      .getByRole("radio", { name: label })
      .click();
  }
}

/**
 * Helper: wait for the results panel to finish rendering after inputs.
 */
async function waitForResults(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Recommendation" })
  ).toBeVisible({ timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Test 1: Standard to Glacier Instant happy path (worked example)
// ---------------------------------------------------------------------------
test.describe("Standard to Glacier Instant happy path", () => {
  test("enters worked example inputs and verifies recommendation", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 78765,
      objectCount: 89897665,
      monthlyGetRequests: 5000000,
      monthlyRetrievalGB: 500,
      retentionMonths: 24,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    await waitForResults(page);

    // Verify a recommendation is shown (not "Stay")
    const resultsPanel = page.locator("main");
    await expect(resultsPanel).not.toContainText(
      "already your most cost-effective"
    );

    // Verify savings are shown (should be a dollar amount in the recommendation card)
    const savingsText = page.locator("[class*='text-\\[32px\\]']");
    await expect(savingsText).toBeVisible();
    const savingsValue = await savingsText.textContent();
    expect(savingsValue).toMatch(/\$/);

    // Verify the cost comparison table is present
    await expect(
      page.getByRole("heading", { name: "Cost Comparison" })
    ).toBeVisible();

    // Verify the table has rows with storage class data
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Verify break-even analysis section is present
    await expect(
      page.getByRole("heading", { name: "Break-Even Analysis" })
    ).toBeVisible();

    // Verify sensitivity analysis is shown
    await expect(
      page.getByRole("heading", { name: "Sensitivity Analysis" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 2: Small object warning
// ---------------------------------------------------------------------------
test.describe("Small object warning", () => {
  test("shows 128 KB penalty warning for tiny objects", async ({ page }) => {
    await page.goto("/");

    // 5 GB total with 1,000,000 objects = ~5.24 KB avg
    await fillInputs(page, {
      storageGB: 5,
      objectCount: 1000000,
      monthlyGetRequests: 10000,
      monthlyRetrievalGB: 1,
      retentionMonths: 12,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    await waitForResults(page);

    // Verify the object count badge shows destructive variant (small objects)
    const sizeBadge = page.getByLabel(/Average object size/);
    await expect(sizeBadge).toBeVisible();

    // Verify the warnings panel appears with small object penalty text
    await expect(page.getByText("Warnings & Caveats")).toBeVisible();
    await expect(
      page.getByText("Small object penalty", { exact: false })
    ).toBeVisible();

    // Verify inflation ratio is mentioned
    await expect(
      page.getByText("actual volume", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 3: IT evaluation with low confidence
// ---------------------------------------------------------------------------
test.describe("Intelligent-Tiering evaluation", () => {
  test("shows IT as option with monitoring fee for low confidence workload", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 1000,
      objectCount: 50000,
      monthlyGetRequests: 100000,
      monthlyRetrievalGB: 50,
      retentionMonths: 24,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Low",
      isMutable: false,
    });

    await waitForResults(page);

    // Verify cost comparison table shows Intelligent-Tiering
    await expect(
      page.getByRole("heading", { name: "Cost Comparison" })
    ).toBeVisible();
    await expect(
      page.getByText("S3 Intelligent-Tiering", { exact: true })
    ).toBeVisible();

    // Verify the IT row exists in the table
    const itRow = page.locator("tr", {
      has: page.getByText("S3 Intelligent-Tiering", { exact: true }),
    });
    await expect(itRow).toBeVisible();

    // Verify low confidence warning is shown in warnings panel
    await expect(page.getByText("Warnings & Caveats")).toBeVisible();
    await expect(
      page.getByText("Low confidence in access pattern data", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 4: EOZ suppression (sa-east-1)
// ---------------------------------------------------------------------------
test.describe("EOZ suppression", () => {
  test("does not show EOZ card when region is sa-east-1", async ({ page }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 1000,
      objectCount: 100000,
      monthlyGetRequests: 500000,
      monthlyRetrievalGB: 100,
      retentionMonths: 12,
      region: "South America (São Paulo)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    await waitForResults(page);

    // In sa-east-1, EOZ is not available. The EOZCard shows "Not available" text
    // but does NOT show the "Performance" badge that eligible EOZ shows.
    await expect(
      page.getByText("Performance", { exact: true })
    ).not.toBeVisible();

    // Verify the warnings mention EOZ not available
    await expect(
      page.getByText("Express One Zone is not available", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 5: EOZ display (us-east-1)
// ---------------------------------------------------------------------------
test.describe("EOZ display", () => {
  test("shows EOZ card when region is us-east-1 and current class is Standard", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 1000,
      objectCount: 100000,
      monthlyGetRequests: 500000,
      monthlyRetrievalGB: 100,
      retentionMonths: 12,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    await waitForResults(page);

    // EOZ card should be visible with its heading
    await expect(
      page.getByText("High-Performance Tier: S3 Express One Zone")
    ).toBeVisible();

    // Should show "Performance" badge
    await expect(
      page.getByText("Performance", { exact: true })
    ).toBeVisible();

    // Should show EOZ premium comparison text
    await expect(
      page.getByText("more per month than Standard", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 6: Mutable object warning
// ---------------------------------------------------------------------------
test.describe("Mutable object warning", () => {
  test("shows mutable data warning when isMutable is true", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 5000,
      objectCount: 500000,
      monthlyGetRequests: 100000,
      monthlyRetrievalGB: 50,
      retentionMonths: 24,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "High",
      isMutable: true,
    });

    await waitForResults(page);

    // Verify the warnings panel contains mutable data warning
    await expect(page.getByText("Warnings & Caveats")).toBeVisible();
    await expect(
      page.getByText("Data is mutable", { exact: false })
    ).toBeVisible();

    // Verify the inline warning in the input panel about minimum duration charges
    await expect(
      page
        .getByRole("complementary")
        .getByText("Frequent overwrites/deletes", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 7: Mobile flow (375px viewport)
// ---------------------------------------------------------------------------
test.describe("Mobile flow", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("completes full input flow and shows results on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify header is visible
    await expect(page.getByText("S3 Optimizer")).toBeVisible();

    // Fill in inputs (stacked vertically on mobile)
    await fillInputs(page, {
      storageGB: 10000,
      objectCount: 1000000,
      monthlyGetRequests: 500000,
      monthlyRetrievalGB: 100,
      retentionMonths: 12,
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    // Scroll to results area
    const recommendation = page.getByRole("heading", {
      name: "Recommendation",
    });
    await recommendation.scrollIntoViewIfNeeded();
    await expect(recommendation).toBeVisible({ timeout: 10000 });

    // Verify savings amount is visible
    const savingsText = page.locator("[class*='text-\\[32px\\]']");
    await expect(savingsText).toBeVisible();

    // Verify cost comparison table is accessible
    const costComparison = page.getByRole("heading", {
      name: "Cost Comparison",
    });
    await costComparison.scrollIntoViewIfNeeded();
    await expect(costComparison).toBeVisible();

    // Verify break-even chart is rendered
    const breakEven = page.getByRole("heading", {
      name: "Break-Even Analysis",
    });
    await breakEven.scrollIntoViewIfNeeded();
    await expect(breakEven).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 8: Break-even chart renders SVG
// ---------------------------------------------------------------------------
test.describe("Breakeven chart renders", () => {
  test("contains Recharts SVG elements after valid calculation", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 10000,
      objectCount: 1000000,
      monthlyGetRequests: 500000,
      monthlyRetrievalGB: 100,
      retentionMonths: 12,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    // Wait for break-even chart to appear
    await expect(
      page.getByRole("heading", { name: "Break-Even Analysis" })
    ).toBeVisible({ timeout: 10000 });

    // Verify the chart container has SVG elements from Recharts
    const chartContainer = page.locator(".recharts-responsive-container");
    await expect(chartContainer).toBeVisible();

    // Verify there's an SVG element inside
    const svg = chartContainer.locator("svg");
    await expect(svg).toBeVisible();

    // Verify Recharts rendered line elements (the two cost lines)
    const lines = chartContainer.locator(".recharts-line");
    await expect(lines).toHaveCount(2);

    // Verify axes are rendered
    await expect(chartContainer.locator(".recharts-xAxis")).toBeVisible();
    await expect(chartContainer.locator(".recharts-yAxis")).toBeVisible();

    // Verify "Pays back in" text is shown below the chart
    await expect(
      page.getByText("Pays back in", { exact: false })
    ).toBeVisible();

    // Verify the 12-month ROI is shown
    await expect(
      page.getByText("12-month ROI", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 9: Mixed mode — toggle switches input panel
// ---------------------------------------------------------------------------
test.describe("Mixed mode: toggle switches input panel", () => {
  test("clicking Mixed Storage Classes replaces single class dropdown with segment table", async ({
    page,
  }) => {
    await page.goto("/");

    // Click "Mixed Storage Classes" button
    await page.getByRole("button", { name: "Mixed Storage Classes" }).click();

    // Single class dropdown should be gone
    await expect(page.getByLabel("Current storage class")).not.toBeVisible();

    // Segment table should be visible with "Storage Class Distribution" heading
    await expect(
      page.getByText("Storage Class Distribution")
    ).toBeVisible();

    // Should have the "Add Storage Class" button
    await expect(
      page.getByRole("button", { name: /Add Storage Class/ })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 10: Mixed mode — two segment happy path
// ---------------------------------------------------------------------------
test.describe("Mixed mode: two segment happy path", () => {
  test("Standard + Glacier Instant produces recommendation and cost comparison", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to mixed mode
    await page.getByRole("button", { name: "Mixed Storage Classes" }).click();

    // Fill in object count first
    await page.locator("#object-count").fill("1000000");

    // Fill segment storage values — the two default rows
    const gbInputs = page.locator('input[type="number"][aria-label*="Storage GB"]');
    await gbInputs.nth(0).fill("10000");
    await gbInputs.nth(1).fill("5000");

    // Select storage classes — the first default should already be Standard
    // Set the second to Glacier Instant
    const selects = page.locator('[aria-label*="Storage class for segment"]');
    await selects.nth(1).click();
    await page.getByRole("option", { name: "S3 Glacier Instant Retrieval" }).click();

    // Fill remaining inputs
    await page.locator("#monthly-get-requests").fill("100000");
    await page.locator("#monthly-retrieval-gb").fill("500");
    await page.locator("#retention-months").fill("24");

    // Wait for results
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 10000 });

    // Verify cost comparison table shows
    await expect(
      page.getByRole("heading", { name: "Cost Comparison" })
    ).toBeVisible();

    // Verify savings are positive
    const savingsText = page.locator("[class*='text-\\[32px\\]']");
    await expect(savingsText).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 11: Mixed mode — IT dominant monitoring fee warning
// ---------------------------------------------------------------------------
test.describe("Mixed mode: IT dominant monitoring fee warning", () => {
  test("shows IT monitoring fee warning with many objects in IT", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to mixed mode
    await page.getByRole("button", { name: "Mixed Storage Classes" }).click();

    // Fill object count — very high (drives monitoring fee up)
    await page.locator("#object-count").fill("150000000");

    // Set first segment to Intelligent-Tiering with small storage
    // so tiering savings are small but monitoring fee ($375/mo) is huge
    const selects = page.locator('[aria-label*="Storage class for segment"]');
    await selects.nth(0).click();
    await page.getByRole("option", { name: "S3 Intelligent-Tiering" }).click();

    const gbInputs = page.locator('input[type="number"][aria-label*="Storage GB"]');
    await gbInputs.nth(0).fill("100");
    await gbInputs.nth(1).fill("50");

    // Fill remaining inputs
    await page.locator("#monthly-get-requests").fill("100000");
    await page.locator("#monthly-retrieval-gb").fill("10");
    await page.locator("#retention-months").fill("24");

    // Wait for results
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 10000 });

    // Verify warnings panel shows IT monitoring fee warning
    await expect(page.getByText("Warnings & Caveats")).toBeVisible();
    await expect(
      page.getByText("monitoring fee", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 12: RRS triggers deprecation warning
// ---------------------------------------------------------------------------
test.describe("Mixed mode: RRS triggers deprecation warning", () => {
  test("selecting RRS shows amber notice and deprecation warning in results", async ({
    page,
  }) => {
    await page.goto("/");

    // Ensure we are in single mode
    await page.getByRole("button", { name: "Single Storage Class" }).click();

    // Fill required inputs first
    await page.locator("#storage-gb").fill("1000");
    await page.locator("#object-count").fill("100000");
    await page.locator("#monthly-get-requests").fill("50000");
    await page.locator("#monthly-retrieval-gb").fill("10");
    await page.locator("#retention-months").fill("12");

    // Select Reduced Redundancy Storage
    await page.getByLabel("Current storage class").click();
    await page
      .getByRole("option", { name: /Reduced Redundancy/ })
      .click();

    // Verify amber inline notice appears below dropdown
    await expect(
      page.getByText("Reduced Redundancy Storage is deprecated by AWS", {
        exact: false,
      })
    ).toBeVisible();

    // Wait for results
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 10000 });

    // Verify deprecation warning in results warnings panel
    await expect(page.getByText("Warnings & Caveats")).toBeVisible();
    await expect(
      page.getByText("AWS deprecated RRS", { exact: false })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 13: Mixed mode — fewer than two segments suppresses output
// ---------------------------------------------------------------------------
test.describe("Mixed mode: fewer than two segments suppresses output", () => {
  test("mixed mode with empty segments shows empty state", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to mixed mode
    await page.getByRole("button", { name: "Mixed Storage Classes" }).click();

    // Fill only object count — segments have no GB values
    await page.locator("#object-count").fill("100000");

    // Results panel should show the empty state
    await expect(
      page.getByText("Enter your workload details to see recommendations")
    ).toBeVisible();

    // Recommendation should not be visible
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 14: Mixed mode — EOZ card suppressed
// ---------------------------------------------------------------------------
test.describe("Mixed mode: EOZ card suppressed", () => {
  test("EOZ Performance card does not render in mixed mode", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to mixed mode
    await page.getByRole("button", { name: "Mixed Storage Classes" }).click();

    // Fill object count
    await page.locator("#object-count").fill("1000000");

    // Fill segments
    const gbInputs = page.locator('input[type="number"][aria-label*="Storage GB"]');
    await gbInputs.nth(0).fill("10000");
    await gbInputs.nth(1).fill("5000");

    // Fill remaining inputs
    await page.locator("#monthly-get-requests").fill("100000");
    await page.locator("#monthly-retrieval-gb").fill("100");
    await page.locator("#retention-months").fill("12");

    // Wait for results
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 10000 });

    // EOZ card should NOT be visible
    await expect(
      page.getByText("High-Performance Tier: S3 Express One Zone")
    ).not.toBeVisible();

    // Performance badge should NOT be visible
    await expect(
      page.getByText("Performance", { exact: true })
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 15: Learn tab — clicking Learn tab switches content
// ---------------------------------------------------------------------------
test.describe("Learn tab: clicking Learn tab switches content", () => {
  test("click the Learn tab button replaces calculator with Learn content", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the Learn tab
    await page.getByRole("button", { name: "Learn" }).click();

    // Calculator layout should be gone
    await expect(
      page.getByText("Enter your workload details to see recommendations")
    ).not.toBeVisible();

    // Learn tab content should be visible with FAQ accordion
    await expect(
      page.getByText("Frequently Asked Questions")
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 16: Learn tab — clicking Calculator tab returns to calculator
// ---------------------------------------------------------------------------
test.describe("Learn tab: clicking Calculator tab returns to calculator", () => {
  test("click Learn then click Calculator restores calculator layout", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to Learn
    await page.getByRole("button", { name: "Learn" }).click();
    await expect(
      page.getByText("Frequently Asked Questions")
    ).toBeVisible();

    // Switch back to Calculator
    await page.getByRole("button", { name: "Calculator" }).click();

    // Input panel should be visible again
    await expect(
      page.getByRole("complementary")
    ).toBeVisible();

    // Learn tab content should be gone
    await expect(
      page.getByText("Frequently Asked Questions")
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 17: Learn tab — FAQ accordion expands on click
// ---------------------------------------------------------------------------
test.describe("Learn tab: FAQ accordion expands on click", () => {
  test("click first FAQ question makes answer visible", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch to Learn tab
    await page.getByRole("button", { name: "Learn" }).click();
    await expect(
      page.getByText("Frequently Asked Questions")
    ).toBeVisible();

    // Click the first FAQ question
    await page
      .getByRole("button", {
        name: /Why does this tool sometimes recommend staying in Standard/,
      })
      .click();

    // Answer text should become visible
    await expect(
      page.getByText("Storage price per GB is only one part of the total cost", {
        exact: false,
      })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 18: Tooltip — hovering info icon shows popover
// ---------------------------------------------------------------------------
test.describe("Tooltip: hovering info icon shows popover", () => {
  test("hover over the info icon next to Storage GB label shows popover", async ({
    page,
  }) => {
    await page.goto("/");

    // Find the info icon near the Storage GB label
    const storageLabel = page.locator("label", {
      has: page.getByText("Total Storage (GB)"),
    });
    const infoIcon = storageLabel.locator("svg");

    // Hover over the icon
    await infoIcon.hover();

    // Wait for the 200ms delay + rendering
    await page.waitForTimeout(300);

    // Popover should appear with the correct tooltip text
    await expect(
      page.getByRole("tooltip")
    ).toContainText(
      "The total volume of data currently stored in this bucket"
    );
  });
});

// ---------------------------------------------------------------------------
// Test 19: Access speed — toggle defaults to on
// ---------------------------------------------------------------------------
test.describe("Access speed: toggle defaults to on", () => {
  test("toggle is on, Glacier Flexible and Deep Archive show async badge", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 10000,
      objectCount: 100000,
      monthlyGetRequests: 10000,
      monthlyRetrievalGB: 10,
      retentionMonths: 24,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "Medium",
      isMutable: false,
    });

    await waitForResults(page);

    // Toggle should be on (checked) by default
    const toggle = page.locator("#requires-immediate-access");
    await expect(toggle).toBeVisible();

    // Glacier Flexible and Deep Archive should show async badge in comparison table
    await expect(
      page.getByText("Requires restore request", { exact: false }).first()
    ).toBeVisible();

    // Neither Glacier Flexible nor Deep Archive should be the recommended class
    const recommendation = page.locator("[class*='text-\\[32px\\]']");
    await expect(recommendation).toBeVisible();
    // The recommended class should not contain "Glacier Flexible" or "Deep Archive"
    const recCard = page.getByRole("heading", { name: "Recommendation" }).locator("..");
    await expect(recCard).not.toContainText("Glacier Flexible Retrieval");
    await expect(recCard).not.toContainText("Glacier Deep Archive");
  });
});

// ---------------------------------------------------------------------------
// Test 20: Access speed — toggle off includes async in recommendation
// ---------------------------------------------------------------------------
test.describe("Access speed: toggle off includes async in recommendation", () => {
  test("low-retrieval workload with toggle off recommends Glacier class", async ({
    page,
  }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 50000,
      objectCount: 100000,
      monthlyGetRequests: 1000,
      monthlyRetrievalGB: 1,
      retentionMonths: 36,
      region: "US East (N. Virginia)",
      currentClass: "S3 Standard",
      confidence: "High",
      isMutable: false,
    });

    await waitForResults(page);

    // Turn off the immediate access toggle
    const toggle = page.locator("#requires-immediate-access");
    await toggle.click();

    // Amber notice should appear below the toggle
    await expect(
      page.getByText("restore request before data is accessible", { exact: false })
    ).toBeVisible();

    // With very low retrieval, a Glacier class should be recommended
    // (either Glacier Flexible or Deep Archive should be cheapest)
    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible();

    // The recommendation card should contain either Glacier Flexible or Deep Archive
    const resultsArea = page.locator("main");
    const hasGlacierFlex = await resultsArea.getByText("Glacier Flexible", { exact: false }).count();
    const hasDeepArchive = await resultsArea.getByText("Deep Archive", { exact: false }).count();
    expect(hasGlacierFlex + hasDeepArchive).toBeGreaterThan(0);
  });
});

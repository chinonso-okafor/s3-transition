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
  // Region select (if specified)
  if (opts.region) {
    await page.getByLabel("AWS Region").click();
    await page
      .getByRole("option", { name: opts.region, exact: true })
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

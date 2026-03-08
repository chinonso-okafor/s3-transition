import { test, expect, Page } from "@playwright/test";

async function fillInputs(
  page: Page,
  opts: {
    storageGB: number;
    objectCount: number;
    monthlyGetRequests: number;
    monthlyRetrievalGB: number;
    retentionMonths: number;
  }
) {
  await page.locator("#storage-gb").fill(String(opts.storageGB));
  await page.locator("#object-count").fill(String(opts.objectCount));
  await page.locator("#monthly-get-requests").fill(String(opts.monthlyGetRequests));
  await page.locator("#monthly-retrieval-gb").fill(String(opts.monthlyRetrievalGB));
  await page.locator("#retention-months").fill(String(opts.retentionMonths));
}

test.describe("Phase 11 Bug 1: retention vs break-even verdict", () => {
  test("verdict sentence appears below savings figure", async ({ page }) => {
    await page.goto("/");

    // Turn off immediate access so async classes can be recommended
    const toggle = page.locator("#requires-immediate-access");

    await fillInputs(page, {
      storageGB: 5000,
      objectCount: 100000,
      monthlyGetRequests: 1000,
      monthlyRetrievalGB: 1,
      retentionMonths: 12,
    });

    await toggle.click();

    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 15000 });

    // The verdict should contain one of these phrases
    const verdictPhrases = [
      "pays back immediately",
      "well beyond",
      "exceeds",
      "close to",
      "shorter than",
    ];

    let foundVerdict = false;
    for (const phrase of verdictPhrases) {
      const count = await page.getByText(phrase, { exact: false }).count();
      if (count > 0) {
        foundVerdict = true;
        break;
      }
    }

    expect(foundVerdict).toBe(true);
  });
});

test.describe("Phase 11 Bug 2: penalty column values at retention=12", () => {
  test("no penalty values shown when retention=12 exceeds all minimums", async ({ page }) => {
    await page.goto("/");

    await fillInputs(page, {
      storageGB: 5000,
      objectCount: 100000,
      monthlyGetRequests: 1000,
      monthlyRetrievalGB: 1,
      retentionMonths: 12,
    });

    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 15000 });

    // At retention=12 months, all class minimums (max 180 days = ~5.9 months) are exceeded.
    // The penalty column header should NOT be visible.
    const penaltyHeader = page.locator("th", { hasText: "Penalty" });
    await expect(penaltyHeader).not.toBeVisible();
  });

  test("penalty column updates to dashes when retention changes from 3 to 12", async ({ page }) => {
    await page.goto("/");

    // First set retention to 3 (should show penalties for some classes)
    await fillInputs(page, {
      storageGB: 5000,
      objectCount: 100000,
      monthlyGetRequests: 1000,
      monthlyRetrievalGB: 1,
      retentionMonths: 3,
    });

    await expect(
      page.getByRole("heading", { name: "Recommendation" })
    ).toBeVisible({ timeout: 15000 });

    // At retention=3 months (91 days), GDA (180-day min) should have a penalty
    const penaltyHeader = page.locator("th", { hasText: "Penalty" });
    await expect(penaltyHeader).toBeVisible();

    // Now change retention to 12
    await page.locator("#retention-months").fill("12");

    // Penalty column should disappear (all penalties are 0 at 12 months)
    await expect(penaltyHeader).not.toBeVisible({ timeout: 5000 });
  });
});

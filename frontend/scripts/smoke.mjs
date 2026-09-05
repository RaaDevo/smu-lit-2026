import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Start the mock backend and frontend first. Uses installed Chrome; no browser download.
const browser = await chromium.launch({
  channel: process.env.SMOKE_BROWSER ?? "chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir("../.qa", { recursive: true });
try {
  await page.goto(process.env.SMOKE_URL ?? "http://localhost:3000");
  await expect(page.getByText("Demo Mode", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Analyse evidence & generate scenarios" })
    .click();
  await page
    .getByRole("button", { name: /Designated-service assessment duty/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Stress Test Firm", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Approve working assumption", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stress Test Firm", exact: true })
    .click();
  await page
    .getByRole("button", { name: /DOWNSTREAM UPDATE.*Associate Training/ })
    .click();
  await expect(page.getByText(/Direct: UNAFFECTED/)).toBeVisible();
  await expect(
    page.getByText("Upstream path: playbook → checklist → training"),
  ).toBeVisible();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "../.qa/impact.png", fullPage: true });
  await page
    .getByRole("button", { name: "Propose remediation & review" })
    .click();
  const playbook = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: /playbook/ }) });
  const edited =
    "IF the working assumption takes effect, obtain and retain the documented assessment; partner review is required before publication.";
  await page
    .getByRole("textbox", { name: "Reviewed wording for playbook" })
    .fill(edited);
  await page
    .getByRole("textbox", { name: "Reviewer note for playbook" })
    .fill("Partner to verify scope before publication.");
  await playbook.getByRole("button", { name: "Accept edited wording" }).click();
  await expect(
    playbook.getByRole("paragraph").filter({ hasText: edited }),
  ).toBeVisible();
  const advisory = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: /advisory/ }) });
  await advisory.getByRole("button", { name: "Escalate", exact: true }).click();
  await expect(advisory.getByText("ESCALATED", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Generate Regulatory Resilience Brief" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Regulatory Resilience Brief",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Lawyer-approved working assumption · hypothetical"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Source register", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review audit trail", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let downloaded = "";
  for await (const chunk of stream) downloaded += chunk;
  const brief = JSON.parse(downloaded);
  assert.deepEqual(
    Object.fromEntries(brief.findings.map((f) => [f.assetId, f.status])),
    {
      playbook: "UPDATE_REQUIRED",
      checklist: "UPDATE_REQUIRED",
      training: "DOWNSTREAM_UPDATE",
      advisory: "REVIEW_REQUIRED",
      clauses: "UNAFFECTED",
    },
  );
  assert.equal(
    brief.patches.find((p) => p.assetId === "playbook").finalReviewedText,
    edited,
  );
  for (const patch of brief.patches) {
    assert.equal(
      patch.originalText,
      brief.firmAssets
        .find((a) => a.id === patch.assetId)
        .sections.find((s) => s.id === patch.section).text,
    );
  }
  assert.equal(brief.decisions.length, 2);
  assert.equal(brief.sources.length, 2);
  await page.screenshot({ path: "../.qa/brief.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("navigation", { name: "Stress-test stages" }),
  ).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Source register", exact: true }),
  ).toBeVisible();
  await page.pdf({
    path: "../.qa/brief.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page
    .getByRole("button", { name: "2. Lawyer assumption", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Working assumption", exact: true })
    .fill("IF the scope changes, ask for a new review.");
  await expect(
    page.getByRole("button", { name: "Stress Test Firm", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "3. Firm impact", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "5. Resilience brief", exact: true }),
  ).toBeDisabled();
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: approval gate, directed propagation, edit/escalate, brief export, original preservation, scenario invalidation.",
  );
} finally {
  await browser.close();
}

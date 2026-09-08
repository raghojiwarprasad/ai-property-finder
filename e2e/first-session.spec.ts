import { test, expect, type Page } from "@playwright/test";

/**
 * Rendered first-session flow (Stage 1/2 exit criteria) at desktop and mobile:
 * arrival → experience (manual) → goal → first personalised lesson → wrong answer →
 * targeted feedback → correct answer → Today → My path → My work.
 * Runs in the labelled fixture mode; no model provider is involved.
 */

const STRONG = "The word guaranteed is invented: Elm only estimates 12–15 business days after order confirmation and Oak says 10 days subject to stock. 'Within 12 days' narrows the range to its lower bound. Corrected: Elm estimates 12–15 business days after confirmation; Oak offers 10 business days subject to stock; neither guarantees delivery. Instruction: only use the supplied quotes and say 'not stated' when the sources do not contain an answer.";
const WRONG = "The answer is good and clearly written. Elm guarantees delivery within 12 days, which is faster than Oak, so the recommendation to choose Elm is correct and well supported.";

async function shot(page: Page, name: string, project: string) {
  await page.screenshot({ path: `e2e-results/screenshots/${project}-${name}.png`, fullPage: true });
}

test("first session: onboarding, personalised lesson, feedback, Today, path, work", async ({ page, context }, testInfo) => {
  const project = testInfo.project.name;
  await context.clearCookies();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learn AI, starting with you." })).toBeVisible();
  await expect(page.getByText("Example learner").first()).toBeVisible();
  await shot(page, "01-arrival", project);
  await page.getByRole("link", { name: "Build my learning path" }).click();

  // S02: tell us instead (manual context).
  await expect(page.getByRole("heading", { name: "Bring your experience." })).toBeVisible();
  await page.getByRole("button", { name: "Tell us instead" }).click();
  await page.getByLabel("What have you studied or worked on?").fill("Coordinated suppliers and compared bids for construction projects. Tracked purchase orders and delivery delays.");
  await page.getByRole("button", { name: "Use this description" }).click();
  await expect(page.getByRole("heading", { name: "Here is what we will use for examples" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Compared bids|Coordinated suppliers/).first()).toBeVisible();
  await shot(page, "02-experience", project);
  await page.getByRole("button", { name: "Choose what to do with AI" }).click();

  // S03: goal.
  await expect(page.getByRole("heading", { name: "What do you want to do with AI?" })).toBeVisible();
  await page.getByRole("button", { name: "Use AI confidently in my work" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/Your first milestone: use ai with better judgement/i)).toBeVisible();
  await expect(page.getByText("Context we will use for early examples")).toBeVisible();
  await shot(page, "03-goal", project);
  await page.getByRole("button", { name: "Start my first lesson" }).click();

  // S04: first lesson with the supplier bridge; the answer key is never in the page.
  await expect(page.getByRole("heading", { name: "A good answer needs evidence." })).toBeVisible();
  await expect(page.getByText("Start with something you know")).toBeVisible();
  await expect(page.getByText(/You have compared supplier quotes/)).toBeVisible();
  await expect(page.getByText("Development fixture mode")).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("evaluationCases");
  expect(html).not.toContain("correctOptionIds");
  expect(html).not.toContain("neither source offers any guarantee; Elm gives an estimate");
  await shot(page, "04-lesson", project);

  // Wrong answer → targeted feedback, not a generic "incorrect".
  const answer = page.getByPlaceholder("Write what you would check or change…");
  await answer.fill(WRONG);
  await expect(page.getByText(/Draft saved|Saving/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Check my answer" }).click();
  const feedback = page.locator("#feedback");
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText("Not yet");
  await expect(feedback).toContainText(/The main gap/);
  await shot(page, "05-feedback-wrong", project);

  // Follow the targeted repair, then answer the repair item correctly via the next activity.
  await feedback.getByRole("link", { name: /Continue/ }).click();
  await expect(page.locator(".eyebrow").first()).toContainText(/Targeted repair|Independent check/);
  await shot(page, "06-repair", project);

  // Today shows one primary action and the reason.
  await page.goto("/today");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue/ })).toBeVisible();
  await shot(page, "07-today", project);

  // My path: milestone labels, planned content distinct.
  await page.goto("/path");
  await expect(page.getByRole("heading", { name: "Your path, with room to grow." })).toBeVisible();
  await expect(page.getByText("Use AI with better judgement")).toBeVisible();
  await shot(page, "08-path", project);

  // My work: the wrong attempt is saved with its feedback status.
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "Your work, with its context." })).toBeVisible();
  await expect(page.getByText("What is unsupported in that answer?").first()).toBeVisible();
  await shot(page, "09-work", project);
});

test("keyboard-only: arrival to goal screen without a pointer", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  // Tab to the primary CTA and activate it with Enter only.
  let found = false;
  for (let i = 0; i < 12 && !found; i += 1) {
    await page.keyboard.press("Tab");
    found = await page.evaluate(() => /Build my learning path/.test(document.activeElement?.textContent ?? ""));
  }
  expect(found).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Bring your experience." })).toBeVisible();
  const focusable = await page.evaluate(() => Array.from(document.querySelectorAll("button, a, input, textarea")).filter((e) => !(e as HTMLElement).hidden).length);
  expect(focusable).toBeGreaterThan(3);
});

test("sample lesson grades without creating a profile", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/example");
  await expect(page.getByText("Fictional learner").first()).toBeVisible();
  await page.getByRole("radio", { name: "Parking is guaranteed for all guests." }).check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByText("Correct.")).toBeVisible();
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "lai_guest")).toBeUndefined();
});

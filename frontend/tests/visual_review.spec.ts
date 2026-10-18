import { test, expect } from '@playwright/test';

const artifactDir = '/Users/alokyadav/.gemini/antigravity/brain/e4f6c6f3-6174-4514-92dd-d0c5c289e366';

test.describe('VEIL Visual Review Pass — Desktop and Mobile', () => {
  test('Capture Desktop & Mobile Screenshots Across All Core Views', async ({ page }) => {
    // 1. Overview Desktop (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(600);
    // Click overview tab to ensure we are on Overview
    const overviewNav = page.getByRole('button', { name: 'Overview', exact: true });
    if (await overviewNav.isVisible()) {
      await overviewNav.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${artifactDir}/review_overview_desktop.png`, fullPage: false });

    // 2. Overview Mobile (390x844 - iPhone 14 size)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${artifactDir}/review_overview_mobile.png`, fullPage: false });

    // 3. Studio Desktop (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Studio', exact: true }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${artifactDir}/review_studio_desktop.png`, fullPage: false });

    // 4. Studio Mobile (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${artifactDir}/review_studio_mobile.png`, fullPage: false });

    // 5. Security Architecture Desktop (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Security', exact: true }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${artifactDir}/review_security_desktop.png`, fullPage: false });

    // 6. Pixel Inspection (Compare) Desktop
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await page.waitForTimeout(600);
    // Click 'Load Sample Comparison' to show active split-curtain
    const sampleCmpBtn = page.getByRole('button', { name: /Load Sample Comparison/i });
    if (await sampleCmpBtn.isVisible()) {
      await sampleCmpBtn.click();
      await page.waitForTimeout(2500);
    }
    await page.screenshot({ path: `${artifactDir}/review_compare_desktop.png`, fullPage: false });

    // 7. Operation History Desktop
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${artifactDir}/review_history_desktop.png`, fullPage: false });
  });
});

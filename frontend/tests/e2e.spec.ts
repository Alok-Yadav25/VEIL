import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('VEIL End-to-End Suite', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/test_carrier.png');

  test('Complete Navigation and UI Workspaces', async ({ page }) => {
    await page.goto('/');

    // 1. Verify landing hero
    await expect(page.locator('h1')).toContainText('Invisible Cryptography');
    await expect(page.getByText('PRIVATE IMAGE STEGANOGRAPHY STUDIO')).toBeVisible();

    // 2. Open Command Palette with keyboard
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder('Type a command or navigate to workspace...')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('Type a command or navigate to workspace...')).not.toBeVisible();

    // 3. Navigate to Security Center
    await page.locator('aside').getByTitle('Security & Telemetry').click();
    await expect(page.getByRole('heading', { name: /Security Architecture/i })).toBeVisible();
    await expect(page.getByText('AES-256-GCM', { exact: true }).first()).toBeVisible();

    // 4. Navigate to Settings
    await page.locator('aside').getByTitle('Studio Settings').click();
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  });

  test('Hide Data, Extract Data, and History Round-Trip', async ({ page }) => {
    const testSecret = 'Playwright End-To-End Confidential Message #2026';
    const testPassword = 'MasterSecurePassword123!';

    await page.goto('/');

    // 1. Go to Conceal Payload
    await page.locator('aside').getByTitle('Conceal Payload').click();

    // 2. Upload carrier image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixturePath);
    await expect(page.getByText('test_carrier.png')).toBeVisible();

    // 3. Enter secret text
    const textarea = page.getByPlaceholder(/Write or paste the confidential message/i);
    await textarea.fill(testSecret);

    // 4. Enter password & confirmation
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill(testPassword);
    await pwdInputs.nth(1).fill(testPassword);

    // 5. Submit encoding
    const submitBtn = page.getByRole('button', { name: /Encrypt & Embed Payload/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 6. Verify Execution Stepper & Result
    await expect(page.getByText(/Embedding & Recoverability Verified/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('VERIFIED', { exact: true })).toBeVisible();

    // 7. Navigate to Activity History
    await page.locator('aside').getByTitle('Session Log').click();
    await expect(page.getByRole('heading', { name: /Operation History/i })).toBeVisible();
    await expect(page.locator('table').getByText('ENCODE TEXT').first()).toBeVisible();
    await expect(page.locator('table').getByText('SUCCESS').first()).toBeVisible();

    // Verify secret is NOT leaked in history table
    const pageContent = await page.content();
    expect(pageContent).not.toContain(testSecret);
    expect(pageContent).not.toContain(testPassword);
  });
});

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
    await expect(page.locator('h1')).toContainText('Your secrets deserve');
    await expect(page.getByText('Offline-First Steganography Workspace')).toBeVisible();

    // 2. Open Command Palette with keyboard
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder('Type a command or navigate to workspace...')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('Type a command or navigate to workspace...')).not.toBeVisible();

    // 3. Navigate to Security Center
    await page.getByRole('button', { name: /Security Center/i }).click();
    await expect(page.getByRole('heading', { name: 'Security Center' })).toBeVisible();
    await expect(page.getByText('AES-256-GCM', { exact: true }).first()).toBeVisible();

    // 4. Navigate to Steganography Explorer
    await page.getByRole('button', { name: /Steganography Explorer/i }).click();
    await expect(page.getByRole('heading', { name: 'Steganography Explorer' })).toBeVisible();
    await expect(page.getByText('Interactive Pixel Grid')).toBeVisible();

    // 5. Navigate to Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  });

  test('Hide Data, Extract Data, and History Round-Trip', async ({ page }) => {
    const testSecret = 'Playwright End-To-End Confidential Message #2026';
    const testPassword = 'MasterSecurePassword123!';

    await page.goto('/');

    // 1. Go to Hide Data
    await page.locator('aside').getByRole('button', { name: 'Hide Data' }).click();
    await expect(page.getByRole('heading', { name: 'Hide Data', level: 1 })).toBeVisible();

    // 2. Step 1: Upload carrier image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixturePath);
    await expect(page.getByText('test_carrier.png')).toBeVisible();

    await page.getByRole('button', { name: 'Next: Choose Payload' }).click();

    // 3. Step 2: Enter secret text
    const textarea = page.getByPlaceholder(/Type or paste confidential text here/i);
    await textarea.fill(testSecret);
    await page.getByRole('button', { name: 'Next: Set Password' }).click();

    // 4. Step 3: Enter password
    const pwdInput = page.getByPlaceholder(/Enter strong password/i);
    await pwdInput.fill(testPassword);
    await page.getByRole('button', { name: 'Next: Capacity Check' }).click();

    // 5. Step 4: Verify Preflight report
    await expect(page.getByText('Ready to Encode')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Next: Review & Confirm' }).click();

    // 6. Step 5: Review & Encrypt
    await expect(page.getByText('AES-256-GCM (PBKDF2 100k rounds)')).toBeVisible();
    await page.getByRole('button', { name: 'Encrypt & Hide' }).click();

    // 7. Step 6: Verify Success Screen
    await expect(page.getByText('Payload Encoded & Protected')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Recoverability Verified', { exact: true })).toBeVisible();

    // 8. Navigate to Activity History
    await page.locator('aside').getByRole('button', { name: 'Operation History' }).click();
    await expect(page.getByRole('heading', { name: 'Operation History' })).toBeVisible();
    await expect(page.locator('table').getByText('ENCODE TEXT').first()).toBeVisible();
    await expect(page.locator('table').getByText('SUCCESS').first()).toBeVisible();

    // Verify secret is NOT leaked in history table
    const pageContent = await page.content();
    expect(pageContent).not.toContain(testSecret);
    expect(pageContent).not.toContain(testPassword);
  });
});

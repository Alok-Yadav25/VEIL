import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = '/Users/alokyadav/.gemini/antigravity/brain/e4f6c6f3-6174-4514-92dd-d0c5c289e366';

test.describe('VEIL 6-Stage Studio Animation Choreography', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/test_carrier.png');

  test('Verify 6 Stages and Capture Visual Evidence', async ({ page }) => {
    // Navigate to studio
    await page.goto('http://127.0.0.1:5173/');

    // Wait for Stage 1 splash to resolve into Stage 2 Pre-Upload
    await page.waitForTimeout(800);

    // Verify Stage 2: 5-Card Thumbnail Fan & Dropzone
    await expect(page.getByText('Zero-Trace Steganography.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload Carrier Image ↑/i })).toBeVisible();
    await page.screenshot({ path: `${artifactDir}/stage2_fan_preupload.png`, fullPage: true });

    // Click sample carrier to trigger Stage 3
    const sampleBtn = page.getByTitle(/Use sample: Cyber Mesh/i);
    await sampleBtn.click();

    // Verify Stage 3: Flanking Collapse, Dot-Matrix Ripple & Lock-in
    await expect(page.getByText(/Carrier verified,/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Configure Payload ↗/i })).toBeVisible();
    await page.screenshot({ path: `${artifactDir}/stage3_ripple_lockin.png`, fullPage: true });

    // Advance to Stage 4: Split-Screen Studio Expansion
    await page.getByRole('button', { name: /Configure Payload ↗/i }).click();

    // Verify Stage 4: Left Reticle Inspector & Right Steganography Controls
    await expect(page.getByText('Carrier Image')).toBeVisible();
    await expect(page.getByText('CAPACITY USAGE:')).toBeVisible();
    await expect(page.getByRole('button', { name: /Encrypt & Embed Payload/i })).toBeVisible();

    // Enter message and passphrase
    const textarea = page.getByPlaceholder(/Enter the confidential message/i);
    await textarea.fill('Top-Secret Telemetry Payload verified by Automated Vitest & Playwright #2026');

    const passInputs = page.locator('input[placeholder*="Passphrase"]');
    await passInputs.first().fill('ObsidianSecretKey2026!');
    const confirmInput = page.getByPlaceholder(/Confirm passphrase/i);
    await confirmInput.fill('ObsidianSecretKey2026!');

    await page.screenshot({ path: `${artifactDir}/stage4_reticle_controls.png`, fullPage: true });

    // Click Encrypt & Embed Payload to trigger Stage 5 and Stage 6
    const submitBtn = page.getByRole('button', { name: /Encrypt & Embed Payload/i });
    await submitBtn.click();

    // Wait for Stage 6 Results Studio to resolve
    await expect(page.getByText('Embedding Completed')).toBeVisible({ timeout: 12000 });
    await expect(page.getByText('Pixel Fidelity Split-Slider')).toBeVisible();
    await expect(page.getByText('Visual Fidelity (Fidelity Engine)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Download Encoded Image/i })).toBeVisible();

    await page.screenshot({ path: `${artifactDir}/stage6_results_split_slider.png`, fullPage: true });
  });
});

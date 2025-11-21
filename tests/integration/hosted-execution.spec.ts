import { test, expect } from '@playwright/test';

test.describe('Hosted Execution Smoke Test', () => {
  test('should execute request via Azure Functions', async ({ page }) => {
    // Assume SWA is running at http://localhost:4280
    // This URL might need to be configured via env var
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4280';
    await page.goto(baseURL);

    // Wait for app to load
    await expect(page.getByText('ApiSpark')).toBeVisible();

    // 1. Load Sample Collection
    // We use the "Load Sample Collection" button on the empty state
    const loadSampleBtn = page.getByRole('button', { name: 'Load Sample Collection' });
    if (await loadSampleBtn.isVisible()) {
      await loadSampleBtn.click();
      await expect(page.getByText('Sample collection created')).toBeVisible();
    }

    // 2. Select a request from the sidebar
    // The sample data usually has "Get Users" or similar.
    // Let's look for a request item in the sidebar.
    // We might need to expand folders.
    // For now, let's try to find "Get Users" which is common in samples.
    await page.getByText('Get Users').first().click();

    // 3. Click Send
    await page.getByTestId('button-send').click();

    // 4. Wait for response
    // We expect a 200 OK from the sample API (jsonplaceholder usually)
    await expect(page.getByText('Response - 200 OK')).toBeVisible({ timeout: 10000 });

    // 5. Check Debug Panel for Hosted Trace
    // Open debug panel
    await page.getByTitle('Open Debug Panel').click();
    
    // Verify we have a response entry
    await expect(page.getByText('200', { exact: true }).first()).toBeVisible();

    // If we are truly running in hosted mode (SWA), we should see the trace link.
    // However, locally with SWA CLI, the Functions runtime might not return a valid Azure Portal URL
    // or might return a placeholder.
    // The logic in execute-request returns a URL with placeholders.
    // So we should see "Hosted Run:" text.
    await expect(page.getByText('Hosted Run:')).toBeVisible();
    await expect(page.getByText('View Trace')).toBeVisible();
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Title screen', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'tabit' })).toBeVisible();
    await expect(page.getByText('I read .h2songs and write tab')).toBeVisible();
  });

  test('shows Load example and Import file buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Load example' })).toBeVisible();
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
  });

  test('shows license link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /github\.com\/andrew-murray\/tabit/i })).toBeVisible();
  });

  test('shows all static songbooks', async ({ page }) => {
    const expectedSongbooks = [
      'Beasties Beltane 2025',
      'Beasties Beltane 2023',
      'Beasties Beltane 2022',
      'The Noise Committee',
      'Púcaí Samhuinn 2024',
      'Ignis Samhuinn 2018',
    ];
    for (const name of expectedSongbooks) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test('Load example navigates to /example', async ({ page }) => {
    await page.getByRole('button', { name: 'Load example' }).click();
    await expect(page).toHaveURL(/\/example/);
  });

  test('clicking a songbook navigates to the songbook page', async ({ page }) => {
    await page.getByText('The Noise Committee').click();
    await expect(page).toHaveURL(/\/songbook\/static\/enc/);
  });

});

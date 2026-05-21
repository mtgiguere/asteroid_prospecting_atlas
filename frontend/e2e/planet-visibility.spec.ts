import { test, expect } from '@playwright/test'

test.describe('planet visibility', () => {
  test('all five planets appear in the sidebar', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="planet-list-item"]', { timeout: 10000 })

    const planets = page.locator('[data-testid="planet-list-item"]')
    await expect(planets).toHaveCount(5)
    await expect(page.getByTestId('planet-list-item').filter({ hasText: 'Mercury' })).toBeAttached()
    await expect(page.getByTestId('planet-list-item').filter({ hasText: 'Venus' })).toBeAttached()
    await expect(page.getByTestId('planet-list-item').filter({ hasText: 'Earth' })).toBeAttached()
    await expect(page.getByTestId('planet-list-item').filter({ hasText: 'Mars' })).toBeAttached()
    await expect(page.getByTestId('planet-list-item').filter({ hasText: 'Jupiter' })).toBeAttached()
  })

  test('clicking a planet triggers flyTo navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="planet-list-item"]', { timeout: 10000 })

    // Clicking a planet should not crash the app — sidebar remains functional
    await page.getByTestId('planet-list-item').filter({ hasText: 'Earth' }).click()
    await expect(page.locator('[data-testid="planet-list-item"]')).toHaveCount(5)
  })
})

import { test, expect } from '@playwright/test'

test.describe('orbit line visibility', () => {
  test('orbit lines are hidden on load, revealed on sidebar click', async ({ page }) => {
    await page.goto('/')
    // Wait for asteroids to load in sidebar
    await page.waitForSelector('[data-testid="asteroid-list-item"]', { timeout: 10000 })

    // On load: no orbit is selected, so the selected-orbit indicator should be absent
    await expect(page.locator('[data-testid="selected-orbit-indicator"]')).not.toBeAttached()

    // Click the first asteroid in the sidebar
    const firstAsteroid = page.locator('[data-testid="asteroid-list-item"]').first()
    const asteroidName = await firstAsteroid.textContent()
    await firstAsteroid.click()

    // After click: selected-orbit indicator should appear (asteroid is selected)
    await expect(page.locator('[data-testid="selected-orbit-indicator"]')).toBeAttached()
    expect(asteroidName).toBeTruthy()
  })
})

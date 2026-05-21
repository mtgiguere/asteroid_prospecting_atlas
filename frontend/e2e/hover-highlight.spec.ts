import { test, expect } from '@playwright/test'

test.describe('hover highlight', () => {
  test('hovering an asteroid in the sidebar sets the hovered indicator', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="asteroid-list-item"]', { timeout: 10000 })

    // On load: no asteroid hovered
    await expect(page.locator('[data-testid="hovered-asteroid-indicator"]')).not.toBeAttached()

    // Hover the first asteroid row in the sidebar
    await page.locator('[data-testid="asteroid-list-item"]').first().hover()

    // Indicator should now be in the DOM
    await expect(page.locator('[data-testid="hovered-asteroid-indicator"]')).toBeAttached()

    // Move away — indicator should disappear
    await page.mouse.move(500, 500)
    await expect(page.locator('[data-testid="hovered-asteroid-indicator"]')).not.toBeAttached()
  })
})

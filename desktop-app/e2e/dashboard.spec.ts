/**
 * Dashboard E2E Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard')
  })

  test('should display key metrics cards', async ({ page }) => {
    // Total Products card
    await expect(page.locator('[data-testid="metric-total-products"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-products"]')).toContainText('Total Products')

    // Total Orders card
    await expect(page.locator('[data-testid="metric-total-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-orders"]')).toContainText('Total Orders')

    // Total Revenue card
    await expect(page.locator('[data-testid="metric-total-revenue"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-revenue"]')).toContainText('Total Revenue')

    // Low Stock Alert card
    await expect(page.locator('[data-testid="metric-low-stock"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-low-stock"]')).toContainText('Low Stock')
  })

  test('should display recent orders', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-orders-title"]')).toContainText('Recent Orders')

    // Check if orders table exists
    const ordersTable = page.locator('[data-testid="orders-table"]')
    await expect(ordersTable).toBeVisible()

    // Should have at least table headers
    await expect(ordersTable.locator('th')).toHaveCount.greaterThan(0)
  })

  test('should display inventory status', async ({ page }) => {
    await expect(page.locator('[data-testid="inventory-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="inventory-status-title"]')).toContainText('Inventory Status')

    // Should show stock levels or charts
    const inventoryContent = page.locator('[data-testid="inventory-content"]')
    await expect(inventoryContent).toBeVisible()
  })

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty state by checking if no data is displayed
    const ordersTable = page.locator('[data-testid="orders-table"] tbody tr')
    const rowCount = await ordersTable.count()

    // If no orders, should show empty state message
    if (rowCount === 0) {
      await expect(page.locator('[data-testid="no-orders-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="no-orders-message"]')).toContainText('No orders found')
    }
  })

  test('should navigate to product management', async ({ page }) => {
    // Click on products metric card
    await page.click('[data-testid="metric-total-products"]')

    // Should navigate to products page or show products modal
    await expect(page.url()).toContain('products')
    // Or check for modal
    // await expect(page.locator('[data-testid="products-modal"]')).toBeVisible()
  })

  test('should navigate to order management', async ({ page }) => {
    // Click on orders metric card
    await page.click('[data-testid="metric-total-orders"]')

    // Should navigate to orders page
    await expect(page.url()).toContain('orders')
  })

  test('should display sales chart', async ({ page }) => {
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="sales-chart-title"]')).toContainText('Sales Overview')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Should still display key elements
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-products"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-orders"]')).toBeVisible()
  })

  test('should handle loading states', async ({ page }) => {
    // Mock slow loading
    await page.route('**/api/dashboard/**', async route => {
      await page.waitForTimeout(2000)
      await route.continue()
    })

    // Reload page to trigger loading
    await page.reload()

    // Should show loading indicators
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-skeleton"]')).toBeVisible()

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="dashboard-loading"]', { state: 'hidden' })
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/**', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.reload()

    // Should show error message
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-error"]')).toContainText('Failed to load dashboard')

    // Should provide retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should refresh data on demand', async ({ page }) => {
    const refreshButton = page.locator('[data-testid="refresh-dashboard"]')
    await expect(refreshButton).toBeVisible()

    // Mock refresh endpoint
    let refreshCount = 0
    await page.route('**/api/dashboard/refresh', async route => {
      refreshCount++
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          totalProducts: 100 + refreshCount,
          totalOrders: 50 + refreshCount
        })
      })
    })

    // Click refresh
    await page.click('[data-testid="refresh-dashboard"]')

    // Should show loading state
    await expect(page.locator('[data-testid="refreshing-indicator"]')).toBeVisible()

    // Wait for completion
    await page.waitForSelector('[data-testid="refreshing-indicator"]', { state: 'hidden' })

    // Should update metrics
    await expect(page.locator('[data-testid="metric-total-products"]')).toContainText('101')
    await expect(page.locator('[data-testid="metric-total-orders"]')).toContainText('51')
  })
})

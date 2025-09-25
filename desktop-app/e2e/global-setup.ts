/**
 * Global Setup for E2E Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')

  // Launch browser context for setup
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC'
  })
  const page = await context.newPage()

  try {
    // Navigate to app and wait for it to load
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for main app to be ready
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 })

    console.log('✅ App loaded successfully')

    // Set up test data
    await setupTestData(page)

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/e2e/setup-screenshot.png', fullPage: true })

    console.log('📸 Setup screenshot captured')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...')

  // Navigate to admin panel or data setup page
  // This would depend on your app's structure

  // Example: Create test products
  try {
    await page.click('[data-testid="add-product-button"]')
    await page.fill('[data-testid="product-name"]', 'E2E Test Product')
    await page.fill('[data-testid="product-price"]', '99.99')
    await page.click('[data-testid="save-product"]')

    console.log('✅ Test product created')

    // Create test orders
    await page.click('[data-testid="add-order-button"]')
    await page.fill('[data-testid="customer-name"]', 'Test Customer')
    await page.fill('[data-testid="customer-email"]', 'test@example.com')
    await page.click('[data-testid="save-order"]')

    console.log('✅ Test order created')

  } catch (error) {
    console.warn('⚠️ Could not set up test data:', error)
    // Don't fail setup if test data creation fails
  }
}

export default globalSetup

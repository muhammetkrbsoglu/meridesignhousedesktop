/**
 * Global Teardown for E2E Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...')

  // Launch browser context for cleanup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to app and clean up test data
    await page.goto('/', { waitUntil: 'networkidle' })

    // Clean up test data
    await cleanupTestData(page)

    // Generate test report
    await generateTestReport()

    console.log('✅ Teardown completed successfully')

  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await context.close()
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  console.log('🧽 Cleaning up test data...')

  try {
    // Navigate to admin panel or data cleanup page
    // This would depend on your app's structure

    // Example: Delete test products and orders
    await page.click('[data-testid="admin-menu"]')

    // Delete test products
    const testProducts = await page.$$('[data-testid="product-item"]:has-text("E2E Test Product")')
    for (const product of testProducts) {
      await product.click('[data-testid="delete-product"]')
      await page.click('[data-testid="confirm-delete"]')
    }

    // Delete test orders
    const testOrders = await page.$$('[data-testid="order-item"]:has-text("Test Customer")')
    for (const order of testOrders) {
      await order.click('[data-testid="delete-order"]')
      await page.click('[data-testid="confirm-delete"]')
    }

    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.warn('⚠️ Could not clean up test data:', error)
  }
}

async function generateTestReport() {
  console.log('📋 Generating test report...')

  try {
    const testResultsDir = './test-results/e2e'
    const reportPath = `${testResultsDir}/test-summary.json`

    // Read test results
    const resultsPath = `${testResultsDir}/results.json`
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))

      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats.tests,
        passedTests: results.stats.passes,
        failedTests: results.stats.failures,
        skippedTests: results.stats.pending,
        duration: results.stats.duration,
        passRate: Math.round((results.stats.passes / results.stats.tests) * 100),
        environment: {
          browser: process.env.BROWSER || 'chromium',
          viewport: '1280x720',
          locale: 'en-US',
          timezone: 'UTC'
        }
      }

      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2))
      console.log(`📄 Test report generated: ${reportPath}`)
    }

  } catch (error) {
    console.warn('⚠️ Could not generate test report:', error)
  }
}

export default globalTeardown

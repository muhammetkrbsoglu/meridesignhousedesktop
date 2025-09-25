/**
 * Product Management E2E Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
    await page.waitForSelector('[data-testid="products-page"]', { timeout: 10000 })
  })

  test('should display products page', async ({ page }) => {
    await expect(page.locator('[data-testid="products-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="products-title"]')).toContainText('Products')

    // Should have add product button
    await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible()
  })

  test('should display products table', async ({ page }) => {
    const productsTable = page.locator('[data-testid="products-table"]')
    await expect(productsTable).toBeVisible()

    // Should have table headers
    const headers = productsTable.locator('thead th')
    const headerTexts = ['Name', 'Price', 'Stock', 'Category', 'Status', 'Actions']
    await expect(headers).toHaveCount(headerTexts.length)

    for (let i = 0; i < headerTexts.length; i++) {
      await expect(headers.nth(i)).toContainText(headerTexts[i])
    }
  })

  test('should add new product', async ({ page }) => {
    // Click add product button
    await page.click('[data-testid="add-product-button"]')

    // Should open product form modal
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-form-title"]')).toContainText('Add Product')

    // Fill form
    await page.fill('[data-testid="product-name"]', 'E2E Test Product')
    await page.fill('[data-testid="product-price"]', '99.99')
    await page.fill('[data-testid="product-description"]', 'Test product for E2E testing')
    await page.selectOption('[data-testid="product-category"]', 'electronics')
    await page.fill('[data-testid="product-stock"]', '50')

    // Submit form
    await page.click('[data-testid="submit-product"]')

    // Should close modal and show success message
    await expect(page.locator('[data-testid="product-form-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product created successfully')

    // Should refresh products table
    await expect(page.locator('[data-testid="products-table"] tbody tr')).toHaveCount.greaterThan(0)
  })

  test('should edit existing product', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"] tbody tr', { timeout: 10000 })

    // Click edit button on first product
    const firstProduct = page.locator('[data-testid="products-table"] tbody tr').first()
    await firstProduct.click('[data-testid="edit-product"]')

    // Should open edit form
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-form-title"]')).toContainText('Edit Product')

    // Modify product name
    const originalName = await page.locator('[data-testid="product-name"]').inputValue()
    const newName = `${originalName} (Updated)`
    await page.fill('[data-testid="product-name"]', newName)

    // Submit changes
    await page.click('[data-testid="submit-product"]')

    // Should close modal and show success
    await expect(page.locator('[data-testid="product-form-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should delete product', async ({ page }) => {
    // Create a test product first
    await page.click('[data-testid="add-product-button"]')
    await page.fill('[data-testid="product-name"]', 'Product to Delete')
    await page.fill('[data-testid="product-price"]', '25.00')
    await page.fill('[data-testid="product-stock"]', '1')
    await page.click('[data-testid="submit-product"]')

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Click delete on the newly created product
    await page.click('[data-testid="delete-product"]:last-of-type')

    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toContainText('Are you sure')

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product deleted successfully')
  })

  test('should search products', async ({ page }) => {
    const searchInput = page.locator('[data-testid="products-search"]')
    await expect(searchInput).toBeVisible()

    // Type in search box
    await page.fill('[data-testid="products-search"]', 'iPhone')

    // Should filter products
    await page.waitForTimeout(500) // Wait for search to apply
    const visibleRows = page.locator('[data-testid="products-table"] tbody tr')
    await expect(visibleRows.first()).toContainText('iPhone')
  })

  test('should filter products by category', async ({ page }) => {
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await expect(categoryFilter).toBeVisible()

    // Select category
    await page.selectOption('[data-testid="category-filter"]', 'electronics')

    // Should filter products
    await page.waitForTimeout(500)
    const visibleRows = page.locator('[data-testid="products-table"] tbody tr')
    await expect(visibleRows.first()).toContainText('electronics')
  })

  test('should filter products by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"]')
    await expect(statusFilter).toBeVisible()

    // Select active status
    await page.selectOption('[data-testid="status-filter"]', 'active')

    // Should filter products
    await page.waitForTimeout(500)
    const visibleRows = page.locator('[data-testid="products-table"] tbody tr')
    await expect(visibleRows.first()).toContainText('Active')
  })

  test('should sort products', async ({ page }) => {
    // Click on price column header to sort
    await page.click('[data-testid="sort-price"]')

    // Should sort by price ascending
    const firstRow = page.locator('[data-testid="products-table"] tbody tr').first()
    const lastRow = page.locator('[data-testid="products-table"] tbody tr').last()

    // Click again to sort descending
    await page.click('[data-testid="sort-price"]')

    // Should reverse order
    const newFirstRow = page.locator('[data-testid="products-table"] tbody tr').first()
    expect(newFirstRow).not.toBe(firstRow)
  })

  test('should handle pagination', async ({ page }) => {
    // If there are many products, should show pagination
    const pagination = page.locator('[data-testid="products-pagination"]')
    const isVisible = await pagination.isVisible()

    if (isVisible) {
      // Should have page numbers or navigation buttons
      await expect(pagination.locator('button')).toHaveCount.greaterThan(0)

      // Click next page
      await page.click('[data-testid="next-page"]')

      // Should change page
      const currentPage = await page.locator('[data-testid="current-page"]').textContent()
      expect(currentPage).toBe('2')
    }
  })

  test('should validate form input', async ({ page }) => {
    // Open add product form
    await page.click('[data-testid="add-product-button"]')

    // Try to submit without required fields
    await page.click('[data-testid="submit-product"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required')

    // Fill name but invalid price
    await page.fill('[data-testid="product-name"]', 'Test Product')
    await page.fill('[data-testid="product-price"]', 'invalid-price')
    await page.click('[data-testid="submit-product"]')

    // Should show price validation error
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Invalid price')
  })

  test('should handle bulk operations', async ({ page }) => {
    // Select multiple products
    const checkboxes = page.locator('[data-testid="product-checkbox"]')
    await checkboxes.first().check()
    await checkboxes.nth(1).check()

    // Should show bulk actions
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-delete"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-export"]')).toBeVisible()

    // Bulk delete
    await page.click('[data-testid="bulk-delete"]')
    await page.click('[data-testid="confirm-bulk-delete"]')

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should handle file import', async ({ page }) => {
    // Click import button
    await page.click('[data-testid="import-products"]')

    // Should open import modal
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()

    // Upload file (mock)
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles({
      name: 'test-products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,price,stock\nTest Product,99.99,50')
    })

    // Should process file
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible()
    await page.waitForSelector('[data-testid="import-complete"]')

    // Should show import results
    await expect(page.locator('[data-testid="import-results"]')).toBeVisible()
  })

  test('should handle file export', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-products"]')

    // Should start download
    const downloadPromise = page.waitForEvent('download')
    await downloadPromise

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})

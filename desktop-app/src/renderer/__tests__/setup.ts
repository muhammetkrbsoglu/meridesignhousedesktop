/**
 * Test Setup for Desktop Application
 * Phase 4: Testing & Deployment Implementation
 */

import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Global test setup
beforeAll(() => {
  // Mock environment variables
  process.env.NODE_ENV = 'test'
  process.env.VITE_ENVIRONMENT = 'testing'

  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.error = (...args) => {
    // Only show errors that aren't from React or testing libraries
    if (typeof args[0] === 'string' && !args[0].includes('React does not recognize')) {
      originalConsoleError(...args)
    }
  }

  console.warn = (...args) => {
    // Only show warnings that aren't from testing libraries
    if (typeof args[0] === 'string' && !args[0].includes('React does not recognize')) {
      originalConsoleWarn(...args)
    }
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    key: (index: number) => null,
    length: 0,
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
})

// Global test cleanup
afterEach(() => {
  cleanup()
  // Clear all mocks
  // Reset any global state
})

// Test utilities
export const testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Wait for a specific amount of time
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch responses
  mockFetchResponse: (data: any, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  },

  // Generate mock data
  mockProduct: (overrides = {}) => ({
    id: 'test-product-1',
    name: 'Test Product',
    price: 99.99,
    stock: 10,
    isActive: true,
    categoryId: 'test-category-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  mockOrder: (overrides = {}) => ({
    id: 'test-order-1',
    orderNumber: 'ORD-001',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    totalAmount: 199.99,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Test data factories
  createMockProducts: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `Test Product ${i + 1}`,
      price: Math.random() * 100,
      stock: Math.floor(Math.random() * 50),
      isActive: Math.random() > 0.1,
      categoryId: `category-${Math.floor(Math.random() * 3) + 1}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }))
  },

  // Form input helpers
  fillInput: (input: HTMLInputElement, value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  },

  clickButton: (button: HTMLButtonElement) => {
    button.click()
    button.dispatchEvent(new Event('click', { bubbles: true }))
  },

  // Accessibility helpers
  expectAccessible: (element: HTMLElement) => {
    expect(element).toHaveAttribute('role')
    expect(element).toHaveAttribute('aria-label')
  },

  // Performance helpers
  measurePerformance: async (fn: () => Promise<void> | void) => {
    const start = performance.now()
    await fn()
    const end = performance.now()
    return end - start
  },
}

// Export types for testing
export type MockProduct = ReturnType<typeof testUtils.mockProduct>
export type MockOrder = ReturnType<typeof testUtils.mockOrder>

/**
 * Performance Testing Script
 * Phase 4: Testing & Deployment Implementation
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      metrics: {},
      recommendations: []
    }
  }

  async runTests() {
    console.log('🚀 Starting Performance Tests...')

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      const page = await browser.newPage()

      // Enable performance monitoring
      await page.tracing.start({ path: 'test-results/performance-trace.json' })

      // Test 1: Initial Load Performance
      await this.testInitialLoad(page)

      // Test 2: Navigation Performance
      await this.testNavigationPerformance(page)

      // Test 3: Search Performance
      await this.testSearchPerformance(page)

      // Test 4: CRUD Operations Performance
      await this.testCRUDPerformance(page)

      // Test 5: Memory Usage
      await this.testMemoryUsage(page)

      // Test 6: Network Performance
      await this.testNetworkPerformance(page)

      // Generate report
      await this.generateReport()

      await page.tracing.stop()

    } catch (error) {
      console.error('❌ Performance test failed:', error)
    } finally {
      await browser.close()
    }
  }

  async testInitialLoad(page) {
    console.log('📊 Testing initial load performance...')

    const startTime = Date.now()

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Wait for main app to load
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 })

    const loadTime = Date.now() - startTime

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      const paint = performance.getEntriesByType('paint')

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
      }
    })

    this.results.metrics.initialLoad = {
      totalTime: loadTime,
      ...metrics
    }

    console.log(`✅ Initial load: ${loadTime}ms`)
  }

  async testNavigationPerformance(page) {
    console.log('📊 Testing navigation performance...')

    const routes = ['/products', '/orders', '/customers', '/reports']
    const navigationTimes = []

    for (const route of routes) {
      const startTime = Date.now()

      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle2'
      })

      await page.waitForSelector('[data-testid="page-loaded"]', { timeout: 5000 })

      const navigationTime = Date.now() - startTime
      navigationTimes.push({ route, time: navigationTime })

      console.log(`✅ Navigation to ${route}: ${navigationTime}ms`)
    }

    this.results.metrics.navigation = {
      averageTime: navigationTimes.reduce((sum, nav) => sum + nav.time, 0) / navigationTimes.length,
      times: navigationTimes
    }
  }

  async testSearchPerformance(page) {
    console.log('📊 Testing search performance...')

    await page.goto('http://localhost:3000/products')

    // Wait for search to be available
    await page.waitForSelector('[data-testid="products-search"]', { timeout: 5000 })

    const searchTerms = ['iPhone', 'Samsung', 'MacBook', 'test']
    const searchResults = []

    for (const term of searchTerms) {
      const startTime = Date.now()

      await page.fill('[data-testid="products-search"]', term)
      await page.waitForTimeout(500) // Wait for search to complete

      const searchTime = Date.now() - startTime
      const resultCount = await page.locator('[data-testid="products-table"] tbody tr').count()

      searchResults.push({ term, time: searchTime, results: resultCount })

      // Clear search
      await page.fill('[data-testid="products-search"]', '')
      await page.waitForTimeout(500)

      console.log(`✅ Search "${term}": ${searchTime}ms (${resultCount} results)`)
    }

    this.results.metrics.search = {
      averageTime: searchResults.reduce((sum, search) => sum + search.time, 0) / searchResults.length,
      results: searchResults
    }
  }

  async testCRUDPerformance(page) {
    console.log('📊 Testing CRUD operations performance...')

    await page.goto('http://localhost:3000/products')

    // Test Create
    const createStart = Date.now()
    await page.click('[data-testid="add-product-button"]')
    await page.fill('[data-testid="product-name"]', 'Performance Test Product')
    await page.fill('[data-testid="product-price"]', '99.99')
    await page.click('[data-testid="submit-product"]')
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
    const createTime = Date.now() - createStart

    console.log(`✅ Create operation: ${createTime}ms`)

    // Test Update
    const updateStart = Date.now()
    await page.click('[data-testid="edit-product"]:last-of-type')
    await page.fill('[data-testid="product-name"]', 'Updated Performance Test Product')
    await page.click('[data-testid="submit-product"]')
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
    const updateTime = Date.now() - updateStart

    console.log(`✅ Update operation: ${updateTime}ms`)

    // Test Delete
    const deleteStart = Date.now()
    await page.click('[data-testid="delete-product"]:last-of-type')
    await page.click('[data-testid="confirm-delete"]')
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
    const deleteTime = Date.now() - deleteStart

    console.log(`✅ Delete operation: ${deleteTime}ms`)

    this.results.metrics.crud = {
      create: createTime,
      update: updateTime,
      delete: deleteTime,
      average: (createTime + updateTime + deleteTime) / 3
    }
  }

  async testMemoryUsage(page) {
    console.log('📊 Testing memory usage...')

    const memoryMetrics = await page.evaluate(() => {
      const memory = (performance as any).memory

      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercent: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    })

    // Test memory leak by creating many elements
    await page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'memory-test-container'

      // Create 1000 elements
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div')
        element.textContent = `Memory test element ${i}`
        element.style.cssText = 'width: 100px; height: 20px; margin: 1px;'
        container.appendChild(element)
      }

      document.body.appendChild(container)
    })

    const memoryAfterLoad = await page.evaluate(() => {
      const memory = (performance as any).memory
      return {
        usedAfterLoad: memory.usedJSHeapSize,
        usedPercentAfter: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    })

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('memory-test-container')
      if (container) {
        container.remove()
      }
    })

    this.results.metrics.memory = {
      initial: memoryMetrics,
      afterLoad: memoryAfterLoad,
      leakDetected: memoryAfterLoad.usedAfterLoad > memoryMetrics.usedJSHeapSize * 1.1
    }

    console.log(`✅ Memory usage: ${Math.round(memoryMetrics.usedPercent)}% (${Math.round(memoryMetrics.usedJSHeapSize / 1024 / 1024)}MB)`)
  }

  async testNetworkPerformance(page) {
    console.log('📊 Testing network performance...')

    // Monitor network requests
    const networkRequests = []

    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      })
    })

    page.on('response', response => {
      const request = networkRequests.find(req => req.url === response.url())
      if (request) {
        request.responseTime = Date.now() - request.timestamp
        request.status = response.status()
      }
    })

    // Navigate to different pages to capture network activity
    const testPages = ['/', '/products', '/orders']
    for (const pageUrl of testPages) {
      await page.goto(`http://localhost:3000${pageUrl}`, { waitUntil: 'networkidle2' })
    }

    // Analyze network performance
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'))
    const staticRequests = networkRequests.filter(req => !req.url.includes('/api/'))

    const avgApiTime = apiRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / apiRequests.length
    const avgStaticTime = staticRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / staticRequests.length

    this.results.metrics.network = {
      totalRequests: networkRequests.length,
      apiRequests: apiRequests.length,
      staticRequests: staticRequests.length,
      averageApiTime: avgApiTime || 0,
      averageStaticTime: avgStaticTime || 0,
      slowRequests: networkRequests.filter(req => (req.responseTime || 0) > 1000).length
    }

    console.log(`✅ Network analysis: ${networkRequests.length} requests, API avg: ${Math.round(avgApiTime)}ms`)
  }

  generateRecommendations() {
    const metrics = this.results.metrics
    const recommendations = []

    // Initial load recommendations
    if (metrics.initialLoad.totalTime > 3000) {
      recommendations.push('🚨 Initial load is slow (>3s). Consider code splitting and lazy loading.')
    } else if (metrics.initialLoad.totalTime > 2000) {
      recommendations.push('⚠️ Initial load could be optimized. Consider reducing bundle size.')
    }

    // Navigation recommendations
    if (metrics.navigation.averageTime > 1000) {
      recommendations.push('🚨 Navigation is slow. Implement route-based code splitting.')
    }

    // Search recommendations
    if (metrics.search.averageTime > 500) {
      recommendations.push('⚠️ Search performance could be improved. Consider debouncing and caching.')
    }

    // CRUD recommendations
    const avgCrudTime = metrics.crud.average
    if (avgCrudTime > 2000) {
      recommendations.push('🚨 CRUD operations are slow. Optimize database queries.')
    } else if (avgCrudTime > 1000) {
      recommendations.push('⚠️ CRUD operations could be faster. Consider optimistic updates.')
    }

    // Memory recommendations
    if (metrics.memory.leakDetected) {
      recommendations.push('🚨 Memory leak detected. Review component cleanup and event listeners.')
    } else if (metrics.memory.initial.usedPercent > 70) {
      recommendations.push('⚠️ High memory usage. Monitor for memory leaks over time.')
    }

    // Network recommendations
    if (metrics.network.slowRequests > 0) {
      recommendations.push(`⚠️ ${metrics.network.slowRequests} slow requests detected (>1s).`)
    }

    if (metrics.network.averageApiTime > 500) {
      recommendations.push('⚠️ API requests are slow. Consider caching or API optimization.')
    }

    return recommendations
  }

  async generateReport() {
    console.log('📋 Generating performance report...')

    this.results.recommendations = this.generateRecommendations()

    const reportPath = 'test-results/performance-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))

    console.log(`📄 Performance report generated: ${reportPath}`)

    // Log summary
    console.log('\n📊 Performance Summary:')
    console.log(`Initial Load: ${this.results.metrics.initialLoad.totalTime}ms`)
    console.log(`Navigation: ${Math.round(this.results.metrics.navigation.averageTime)}ms avg`)
    console.log(`Search: ${Math.round(this.results.metrics.search.averageTime)}ms avg`)
    console.log(`CRUD: ${Math.round(this.results.metrics.crud.average)}ms avg`)
    console.log(`Memory Usage: ${Math.round(this.results.metrics.memory.initial.usedPercent)}%`)

    console.log('\n💡 Recommendations:')
    this.results.recommendations.forEach(rec => console.log(rec))

    const score = this.calculatePerformanceScore()
    console.log(`\n🎯 Overall Performance Score: ${score}/100`)

    if (score >= 90) {
      console.log('🏆 Excellent performance!')
    } else if (score >= 70) {
      console.log('✅ Good performance with room for improvement')
    } else if (score >= 50) {
      console.log('⚠️ Moderate performance - optimization recommended')
    } else {
      console.log('🚨 Poor performance - immediate optimization required')
    }
  }

  calculatePerformanceScore() {
    const metrics = this.results.metrics
    let score = 100

    // Initial load penalty
    if (metrics.initialLoad.totalTime > 3000) score -= 30
    else if (metrics.initialLoad.totalTime > 2000) score -= 20
    else if (metrics.initialLoad.totalTime > 1000) score -= 10

    // Navigation penalty
    if (metrics.navigation.averageTime > 1000) score -= 20
    else if (metrics.navigation.averageTime > 500) score -= 10

    // Search penalty
    if (metrics.search.averageTime > 500) score -= 15
    else if (metrics.search.averageTime > 300) score -= 5

    // CRUD penalty
    if (metrics.crud.average > 2000) score -= 20
    else if (metrics.crud.average > 1000) score -= 10

    // Memory penalty
    if (metrics.memory.leakDetected) score -= 25
    else if (metrics.memory.initial.usedPercent > 80) score -= 15
    else if (metrics.memory.initial.usedPercent > 60) score -= 5

    // Network penalty
    if (metrics.network.slowRequests > 5) score -= 15
    else if (metrics.network.slowRequests > 0) score -= 5

    return Math.max(0, Math.round(score))
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.runTests().catch(console.error)
}

module.exports = PerformanceTester

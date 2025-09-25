/**
 * Security Testing Script
 * Phase 4: Testing & Deployment Implementation
 */

const puppeteer = require('puppeteer')
const fs = require('fs')

class SecurityTester {
  constructor() {
    this.vulnerabilities = []
    this.results = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      score: 100,
      recommendations: []
    }
  }

  async runTests() {
    console.log('🔒 Starting Security Tests...')

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    try {
      const page = await browser.newPage()

      // Test XSS vulnerabilities
      await this.testXSS(page)

      // Test CSRF vulnerabilities
      await this.testCSRF(page)

      // Test SQL injection
      await this.testSQLInjection(page)

      // Test authentication bypass
      await this.testAuthBypass(page)

      // Test input validation
      await this.testInputValidation(page)

      // Test CORS policy
      await this.testCORS(page)

      // Test content security policy
      await this.testCSP(page)

      // Test session management
      await this.testSessionManagement(page)

      // Test file upload security
      await this.testFileUpload(page)

      // Test API security
      await this.testAPI(page)

      // Generate report
      await this.generateReport()

    } catch (error) {
      console.error('❌ Security test failed:', error)
    } finally {
      await browser.close()
    }
  }

  async testXSS(page) {
    console.log('🔍 Testing XSS vulnerabilities...')

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')">'
    ]

    for (const payload of xssPayloads) {
      try {
        // Test in search input
        await page.goto('http://localhost:3000/products')
        await page.fill('[data-testid="products-search"]', payload)
        await page.waitForTimeout(1000)

        const wasExecuted = await page.evaluate(() => {
          return window.xssExecuted || false
        })

        if (wasExecuted) {
          this.addVulnerability('XSS', 'HIGH', `XSS payload executed: ${payload}`)
        }

        // Test in product name field
        await page.click('[data-testid="add-product-button"]')
        await page.fill('[data-testid="product-name"]', payload)
        await page.click('[data-testid="submit-product"]')
        await page.waitForTimeout(1000)

        const formExecuted = await page.evaluate(() => {
          return window.xssExecuted || false
        })

        if (formExecuted) {
          this.addVulnerability('XSS', 'HIGH', `XSS in form field: ${payload}`)
        }

      } catch (error) {
        console.warn(`XSS test error for payload ${payload}:`, error)
      }
    }

    console.log('✅ XSS testing completed')
  }

  async testCSRF(page) {
    console.log('🔍 Testing CSRF vulnerabilities...')

    try {
      // Try to make unauthorized request
      await page.setExtraHTTPHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })

      // Attempt CSRF attack
      const csrfResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            body: 'name=CSRF Test&price=99.99',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
          return { status: response.status, success: response.ok }
        } catch (error) {
          return { error: error.message }
        }
      })

      if (csrfResponse.success) {
        this.addVulnerability('CSRF', 'HIGH', 'CSRF protection not implemented')
      }

    } catch (error) {
      console.warn('CSRF test error:', error)
    }

    console.log('✅ CSRF testing completed')
  }

  async testSQLInjection(page) {
    console.log('🔍 Testing SQL injection vulnerabilities...')

    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin' --",
      "' OR 1=1 --"
    ]

    for (const payload of sqlPayloads) {
      try {
        await page.goto('http://localhost:3000/products')
        await page.fill('[data-testid="products-search"]', payload)

        // Check for SQL errors in response
        await page.waitForTimeout(1000)

        const errorMessages = await page.$$('[data-testid*="error"], .error, [class*="error"]')
        const hasSqlError = errorMessages.length > 0

        if (hasSqlError) {
          this.addVulnerability('SQL Injection', 'HIGH', `SQL injection possible: ${payload}`)
        }

      } catch (error) {
        console.warn(`SQL injection test error for payload ${payload}:`, error)
      }
    }

    console.log('✅ SQL injection testing completed')
  }

  async testAuthBypass(page) {
    console.log('🔍 Testing authentication bypass...')

    try {
      // Try to access protected routes without auth
      const protectedRoutes = ['/admin', '/settings', '/profile']

      for (const route of protectedRoutes) {
        const response = await page.goto(`http://localhost:3000${route}`)

        if (response.status() === 200) {
          // Check if redirected to login or blocked
          const currentUrl = page.url()

          if (currentUrl.includes(route)) {
            this.addVulnerability('Auth Bypass', 'HIGH', `Protected route accessible without auth: ${route}`)
          }
        }
      }

      // Test with fake JWT token
      await page.setExtraHTTPHeaders({
        'Authorization': 'Bearer fake.jwt.token'
      })

      await page.goto('http://localhost:3000/admin')

      const currentUrl = page.url()
      if (currentUrl.includes('/admin')) {
        this.addVulnerability('Auth Bypass', 'HIGH', 'Fake JWT token accepted')
      }

    } catch (error) {
      console.warn('Auth bypass test error:', error)
    }

    console.log('✅ Auth bypass testing completed')
  }

  async testInputValidation(page) {
    console.log('🔍 Testing input validation...')

    try {
      // Test with very long input
      const longInput = 'A'.repeat(10000)

      await page.goto('http://localhost:3000/products')
      await page.click('[data-testid="add-product-button"]')
      await page.fill('[data-testid="product-name"]', longInput)

      const validationError = await page.$('[data-testid*="error"]')

      if (!validationError) {
        this.addVulnerability('Input Validation', 'MEDIUM', 'No input length validation')
      }

      // Test with special characters
      const specialChars = '<>"\'&@#$%^&*()'
      await page.fill('[data-testid="product-name"]', specialChars)

      const specialCharError = await page.$('[data-testid*="error"]')

      if (!specialCharError) {
        this.addVulnerability('Input Validation', 'LOW', 'Special characters not properly sanitized')
      }

    } catch (error) {
      console.warn('Input validation test error:', error)
    }

    console.log('✅ Input validation testing completed')
  }

  async testCORS(page) {
    console.log('🔍 Testing CORS policy...')

    try {
      const corsResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:3000/api/test-cors', {
            method: 'OPTIONS',
            headers: {
              'Origin': 'http://evil.com',
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'X-Custom-Header'
            }
          })
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            allowed: response.headers.get('access-control-allow-origin') === '*'
          }
        } catch (error) {
          return { error: error.message }
        }
      })

      if (corsResponse.allowed) {
        this.addVulnerability('CORS', 'HIGH', 'CORS allows all origins (*)')
      }

    } catch (error) {
      console.warn('CORS test error:', error)
    }

    console.log('✅ CORS testing completed')
  }

  async testCSP(page) {
    console.log('🔍 Testing Content Security Policy...')

    try {
      const cspHeader = await page.evaluate(() => {
        return document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ||
               document.querySelector('meta[name="Content-Security-Policy"]')?.content
      })

      if (!cspHeader) {
        this.addVulnerability('CSP', 'HIGH', 'No Content Security Policy found')
        return
      }

      // Check for weak CSP directives
      const weakDirectives = [
        'unsafe-inline',
        'unsafe-eval',
        'script-src *',
        'style-src *'
      ]

      for (const directive of weakDirectives) {
        if (cspHeader.includes(directive)) {
          this.addVulnerability('CSP', 'HIGH', `Weak CSP directive found: ${directive}`)
        }
      }

      // Check for missing important directives
      const requiredDirectives = ['script-src', 'style-src', 'img-src', 'connect-src']

      for (const directive of requiredDirectives) {
        if (!cspHeader.includes(directive)) {
          this.addVulnerability('CSP', 'MEDIUM', `Missing CSP directive: ${directive}`)
        }
      }

    } catch (error) {
      console.warn('CSP test error:', error)
    }

    console.log('✅ CSP testing completed')
  }

  async testSessionManagement(page) {
    console.log('🔍 Testing session management...')

    try {
      // Check for secure session cookies
      const cookies = await page.cookies()

      for (const cookie of cookies) {
        if (cookie.name.toLowerCase().includes('session')) {
          if (!cookie.secure) {
            this.addVulnerability('Session Management', 'HIGH', 'Session cookie not marked as secure')
          }

          if (!cookie.httpOnly) {
            this.addVulnerability('Session Management', 'HIGH', 'Session cookie not marked as httpOnly')
          }

          if (cookie.sameSite !== 'strict' && cookie.sameSite !== 'lax') {
            this.addVulnerability('Session Management', 'MEDIUM', 'Session cookie missing SameSite attribute')
          }
        }
      }

      // Test session timeout
      await page.goto('http://localhost:3000')
      await page.waitForSelector('[data-testid="app-root"]')

      // Wait for session timeout (simulate long inactivity)
      await page.waitForTimeout(60000) // 1 minute

      // Try to make a request
      const timeoutResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/user/profile')
          return { status: response.status, redirected: response.redirected }
        } catch (error) {
          return { error: error.message }
        }
      })

      if (timeoutResponse.status === 200) {
        this.addVulnerability('Session Management', 'HIGH', 'Session does not timeout properly')
      }

    } catch (error) {
      console.warn('Session management test error:', error)
    }

    console.log('✅ Session management testing completed')
  }

  async testFileUpload(page) {
    console.log('🔍 Testing file upload security...')

    try {
      // Test malicious file upload
      const maliciousFiles = [
        { name: 'malicious.exe', content: 'malicious executable content', type: 'application/x-msdownload' },
        { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
        { name: 'xss.svg', content: '<svg onload="alert(\'XSS\')"></svg>', type: 'image/svg+xml' }
      ]

      for (const file of maliciousFiles) {
        await page.goto('http://localhost:3000/upload')

        const fileInput = await page.$('input[type="file"]')
        if (fileInput) {
          await fileInput.setInputFiles({
            name: file.name,
            mimeType: file.type,
            buffer: Buffer.from(file.content)
          })

          await page.click('[data-testid="upload-submit"]')
          await page.waitForTimeout(2000)

          const uploadResult = await page.evaluate(() => {
            return document.querySelector('[data-testid="upload-result"]')?.textContent || ''
          })

          if (uploadResult.includes('success')) {
            this.addVulnerability('File Upload', 'HIGH', `Malicious file uploaded: ${file.name}`)
          }
        }
      }

    } catch (error) {
      console.warn('File upload test error:', error)
    }

    console.log('✅ File upload testing completed')
  }

  async testAPI(page) {
    console.log('🔍 Testing API security...')

    try {
      // Test API key exposure
      await page.goto('http://localhost:3000')
      await page.waitForTimeout(1000)

      const pageSource = await page.content()
      const apiKeyPatterns = [
        /api[_-]?key/i,
        /secret/i,
        /token/i,
        /bearer/i
      ]

      for (const pattern of apiKeyPatterns) {
        if (pattern.test(pageSource)) {
          this.addVulnerability('API Security', 'HIGH', `Potential API key exposure in page source: ${pattern}`)
        }
      }

      // Test API rate limiting
      const requests = []
      for (let i = 0; i < 100; i++) {
        requests.push(
          page.evaluate(() => fetch('/api/products').then(r => r.status))
        )
      }

      const responses = await Promise.all(requests)
      const rateLimited = responses.filter(status => status === 429).length

      if (rateLimited === 0) {
        this.addVulnerability('API Security', 'MEDIUM', 'No API rate limiting detected')
      }

    } catch (error) {
      console.warn('API security test error:', error)
    }

    console.log('✅ API security testing completed')
  }

  addVulnerability(type, severity, description) {
    const vulnerability = {
      type,
      severity: severity.toUpperCase(),
      description,
      timestamp: new Date().toISOString()
    }

    this.vulnerabilities.push(vulnerability)
    this.results.vulnerabilities.push(vulnerability)

    // Calculate score reduction
    const scoreReduction = {
      'HIGH': 30,
      'MEDIUM': 15,
      'LOW': 5
    }[severity.toUpperCase()] || 0

    this.results.score = Math.max(0, this.results.score - scoreReduction)

    console.log(`🚨 ${severity} vulnerability found: ${type} - ${description}`)
  }

  generateRecommendations() {
    const recommendations = []

    if (this.vulnerabilities.length === 0) {
      recommendations.push('✅ No security vulnerabilities found')
      return recommendations
    }

    const highRisk = this.vulnerabilities.filter(v => v.severity === 'HIGH').length
    const mediumRisk = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length
    const lowRisk = this.vulnerabilities.filter(v => v.severity === 'LOW').length

    if (highRisk > 0) {
      recommendations.push(`🚨 CRITICAL: ${highRisk} high-risk vulnerabilities require immediate attention`)
    }

    if (mediumRisk > 0) {
      recommendations.push(`⚠️ ${mediumRisk} medium-risk vulnerabilities should be addressed`)
    }

    if (lowRisk > 0) {
      recommendations.push(`ℹ️ ${lowRisk} low-risk vulnerabilities can be addressed in maintenance`)
    }

    recommendations.push('🔒 Implement proper input validation and sanitization')
    recommendations.push('🔒 Use HTTPS in production')
    recommendations.push('🔒 Implement Content Security Policy (CSP)')
    recommendations.push('🔒 Add rate limiting to API endpoints')
    recommendations.push('🔒 Use secure session management')
    recommendations.push('🔒 Regular security audits and penetration testing')

    return recommendations
  }

  async generateReport() {
    console.log('📋 Generating security report...')

    this.results.recommendations = this.generateRecommendations()

    const reportPath = 'test-results/security-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))

    console.log(`📄 Security report generated: ${reportPath}`)

    // Log summary
    console.log('\n🔒 Security Summary:')
    console.log(`Vulnerabilities Found: ${this.vulnerabilities.length}`)
    console.log(`High Risk: ${this.vulnerabilities.filter(v => v.severity === 'HIGH').length}`)
    console.log(`Medium Risk: ${this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length}`)
    console.log(`Low Risk: ${this.vulnerabilities.filter(v => v.severity === 'LOW').length}`)
    console.log(`Security Score: ${this.results.score}/100`)

    console.log('\n💡 Recommendations:')
    this.results.recommendations.forEach(rec => console.log(rec))

    if (this.results.score >= 90) {
      console.log('🛡️ Excellent security posture!')
    } else if (this.results.score >= 70) {
      console.log('🛡️ Good security with minor issues')
    } else if (this.results.score >= 50) {
      console.log('🛡️ Moderate security - improvements needed')
    } else {
      console.log('🛡️ Poor security - immediate action required')
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SecurityTester()
  tester.runTests().catch(console.error)
}

module.exports = SecurityTester

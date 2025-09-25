/**
 * Validation Service Unit Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationService } from '../validation'

describe('ValidationService', () => {
  let validationService: ValidationService

  beforeEach(() => {
    validationService = ValidationService.getInstance()
  })

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test123@test-domain.com',
        'user+tag@example.org'
      ]

      validEmails.forEach(email => {
        const result = validationService.validateEmail(email)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'test@',
        'test@@example.com',
        'test example.com',
        'test@.com'
      ]

      invalidEmails.forEach(email => {
        const result = validationService.validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(1)
      })
    })

    it('should handle empty email with allowEmpty option', () => {
      const result = validationService.validateEmail('', { allowEmpty: true })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Phone Validation', () => {
    it('should validate Turkish phone numbers', () => {
      const validPhones = [
        '05051234567',
        '5051234567',
        '905051234567',
        '02123456789'
      ]

      validPhones.forEach(phone => {
        const result = validationService.validatePhone(phone)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123',
        'abc1234567',
        '050512345678901234567890', // too long
        '05051', // too short
        '0505abc123', // invalid format
        '99912345678' // invalid prefix
      ]

      invalidPhones.forEach(phone => {
        const result = validationService.validatePhone(phone)
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(1)
      })
    })
  })

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.com',
        'https://subdomain.example.org/path',
        'https://example.com?param=value',
        'https://example.com/path#section'
      ]

      validUrls.forEach(url => {
        const result = validationService.validateUrl(url)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'http://',
        'https://example..com', // double dot
        'https://.example.com' // leading dot
      ]

      invalidUrls.forEach(url => {
        const result = validationService.validateUrl(url)
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(1)
      })
    })
  })

  describe('Numeric Validation', () => {
    it('should validate numbers within range', () => {
      const result = validationService.validateNumber(50, 'Test Number', {
        min: 0,
        max: 100,
        decimals: 2
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject numbers outside range', () => {
      const belowMin = validationService.validateNumber(-5, 'Test Number', { min: 0 })
      expect(belowMin.isValid).toBe(false)
      expect(belowMin.errors).toContain('Test Number must be at least 0')

      const aboveMax = validationService.validateNumber(150, 'Test Number', { max: 100 })
      expect(aboveMax.isValid).toBe(false)
      expect(aboveMax.errors).toContain('Test Number must be at most 100')
    })

    it('should warn about excessive decimal places', () => {
      const result = validationService.validateNumber(1.23456, 'Test Number', { decimals: 2 })
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Test Number has more decimal places than recommended')
    })
  })

  describe('Text Validation', () => {
    it('should validate text within length limits', () => {
      const result = validationService.validateText('Hello World', 'Test Text', {
        minLength: 5,
        maxLength: 20
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject text outside length limits', () => {
      const tooShort = validationService.validateText('Hi', 'Test Text', { minLength: 5 })
      expect(tooShort.isValid).toBe(false)
      expect(tooShort.errors).toContain('Test Text must be at least 5 characters')

      const tooLong = validationService.validateText('A'.repeat(300), 'Test Text', { maxLength: 255 })
      expect(tooLong.isValid).toBe(false)
      expect(tooLong.errors).toContain('Test Text must be at most 255 characters')
    })

    it('should warn about special characters when not allowed', () => {
      const result = validationService.validateText('Hello @ World!', 'Test Text', {
        allowSpecialChars: false
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Test Text contains special characters')
    })
  })

  describe('Record Validation', () => {
    it('should validate product records', () => {
      const product = {
        name: 'Test Product',
        price: 99.99,
        stock: 10
      }

      const result = validationService.validateRecord('products', product, 'create')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate order records', () => {
      const order = {
        orderNumber: 'ORD-001',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        totalAmount: 199.99
      }

      const result = validationService.validateRecord('orders', order, 'create')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid records', () => {
      const invalidProduct = {
        name: '', // Required field missing
        price: -10 // Negative price
      }

      const result = validationService.validateRecord('products', invalidProduct, 'create')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Batch Validation', () => {
    it('should validate multiple records', () => {
      const products = [
        { name: 'Product 1', price: 10.99, stock: 5 },
        { name: 'Product 2', price: 20.99, stock: 10 },
        { name: '', price: -5, stock: -1 } // Invalid product
      ]

      const result = validationService.validateBatch('products', products, 'create')

      expect(result.validRecords).toHaveLength(2)
      expect(result.invalidRecords).toHaveLength(1)
      expect(result.invalidRecords[0].errors.length).toBeGreaterThan(0)
    })
  })
})

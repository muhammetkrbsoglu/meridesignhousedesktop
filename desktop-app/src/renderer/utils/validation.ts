/**
 * Simple Validation Service - No over engineering
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationOptions {
  required?: boolean
  minLength?: number
  maxLength?: number
}

export class ValidationService {
  // Singleton pattern removed - just use class methods

  /**
   * Validate email
   */
  public validateEmail(email: string, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = []

    if (options.required && (!email || email.trim() === '')) {
      errors.push('Email is required')
      return { isValid: false, errors }
    }

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format')
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate phone number (Turkish format)
   */
  public validatePhone(phone: string, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = []

    if (options.required && (!phone || phone.trim() === '')) {
      errors.push('Phone number is required')
      return { isValid: false, errors }
    }

    if (phone && phone.trim() !== '') {
      const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        errors.push('Invalid phone number format')
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate required field
   */
  public validateRequired(value: any, fieldName: string): ValidationResult {
    const errors: string[] = []

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${fieldName} is required`)
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate string length
   */
  public validateLength(value: string, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = []

    if (options.minLength && value.length < options.minLength) {
      errors.push(`Minimum length is ${options.minLength}`)
    }

    if (options.maxLength && value.length > options.maxLength) {
      errors.push(`Maximum length is ${options.maxLength}`)
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate positive number
   */
  public validatePositiveNumber(value: number, fieldName: string): ValidationResult {
    const errors: string[] = []

    if (isNaN(value) || value < 0) {
      errors.push(`${fieldName} must be a positive number`)
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate multiple fields
   */
  public validateMultiple(validations: ValidationResult[]): ValidationResult {
    const allErrors: string[] = []
    let isValid = true

    for (const validation of validations) {
      if (!validation.isValid) {
        isValid = false
        allErrors.push(...validation.errors)
      }
    }

    return { isValid, errors: allErrors }
  }
}

export const validationService = new ValidationService()

export default ValidationService
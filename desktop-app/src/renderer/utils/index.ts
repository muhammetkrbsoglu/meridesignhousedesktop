// Re-export all utilities for easier importing
export * from './errorHandler'
export * from './validation'
export * from './pagination'

// Export specific utilities that are used directly
export { ErrorHandler } from './errorHandler'

// Create and export useErrorHandler hook
import { ErrorHandler } from './errorHandler'
import { useCallback } from 'react'

export const useErrorHandler = () => {
  return useCallback((error: Error, context?: string) => {
    ErrorHandler.handle(error, context || 'Component')
  }, [])
}
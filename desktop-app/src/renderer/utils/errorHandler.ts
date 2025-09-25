/**
 * Simple Error Handler - No over engineering
 */

export interface AppError {
  message: string
  code?: string
  context?: string
  timestamp: Date
}

export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static handle(error: any, context: string = ''): AppError {
    const appError: AppError = {
      message: error?.message || 'An error occurred',
      code: error?.code,
      context,
      timestamp: new Date()
    }

    // Simple console logging
    console.error(`[${context}] ${appError.message}`, error)

    // Show user-friendly notification
    this.showUserNotification(appError)

    return appError
  }

  /**
   * Show user-friendly notification
   */
  private static showUserNotification(error: AppError) {
    // Simple alert for now - can be enhanced with toast notifications
    if (error.context?.includes('critical') || error.context?.includes('database')) {
      alert(`Error: ${error.message}`)
    }
  }

  /**
   * Create error from message
   */
  static createError(message: string, code?: string, context?: string): AppError {
    return {
      message,
      code,
      context,
      timestamp: new Date()
    }
  }

  /**
   * Handle async errors
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string = '',
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      this.handle(error, context)
      return fallback
    }
  }
}

export default ErrorHandler
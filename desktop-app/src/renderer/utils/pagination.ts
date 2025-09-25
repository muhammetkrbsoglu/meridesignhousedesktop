/**
 * Pagination utilities and types
 */

import { PAGINATION } from '../constants'

export interface PaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  totalItems: number,
  currentPage: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize)
  const hasNext = currentPage < totalPages
  const hasPrevious = currentPage > 1

  return {
    page: currentPage,
    pageSize,
    total: totalItems,
    totalPages,
    hasNext,
    hasPrevious
  }
}

/**
 * Generate pagination range for UI
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  const range: (number | string)[] = []

  // Add first page and ellipsis if needed
  if (start > 1) {
    range.push(1)
    if (start > 2) {
      range.push('...')
    }
  }

  // Add visible range
  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  // Add last page and ellipsis if needed
  if (end < totalPages) {
    if (end < totalPages - 1) {
      range.push('...')
    }
    range.push(totalPages)
  }

  return range
}

/**
 * Create pagination parameters for database queries
 */
export function createPaginationParams(options: PaginationOptions) {
  const page = Math.max(1, options.page || PAGINATION.DEFAULT_PAGE)
  const pageSize = Math.min(
    Math.max(1, options.pageSize || PAGINATION.DEFAULT_PAGE_SIZE),
    PAGINATION.MAX_PAGE_SIZE
  )

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    sortBy: options.sortBy || 'created_at',
    sortOrder: options.sortOrder || 'desc',
    filters: options.filters || {}
  }
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options: PaginationOptions): {
  isValid: boolean
  errors: string[]
  sanitized: PaginationOptions
} {
  const errors: string[] = []
  const sanitized: PaginationOptions = { ...options }

  // Validate page
  if (options.page !== undefined) {
    if (typeof options.page !== 'number' || options.page < 1) {
      errors.push('Page must be a positive number')
      sanitized.page = 1
    } else if (options.page > 10000) {
      errors.push('Page number too large')
      sanitized.page = 10000
    }
  }

  // Validate page size
  if (options.pageSize !== undefined) {
    if (typeof options.pageSize !== 'number' || options.pageSize < 1) {
      errors.push('Page size must be a positive number')
      sanitized.pageSize = PAGINATION.DEFAULT_PAGE_SIZE
    } else if (options.pageSize > PAGINATION.MAX_PAGE_SIZE) {
      errors.push(`Page size cannot exceed ${PAGINATION.MAX_PAGE_SIZE}`)
      sanitized.pageSize = PAGINATION.MAX_PAGE_SIZE
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Pagination hook for React components
 */
export function usePagination(initialOptions: PaginationOptions = {}) {
  const [options, setOptions] = React.useState<PaginationOptions>(initialOptions)

  const goToPage = (page: number) => {
    setOptions(prev => ({ ...prev, page }))
  }

  const changePageSize = (pageSize: number) => {
    setOptions(prev => ({ ...prev, pageSize, page: 1 })) // Reset to first page
  }

  const nextPage = () => {
    setOptions(prev => ({ ...prev, page: (prev.page || 1) + 1 }))
  }

  const previousPage = () => {
    setOptions(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
  }

  const resetPagination = () => {
    setOptions(initialOptions)
  }

  const setFilters = (filters: Record<string, any>) => {
    setOptions(prev => ({ ...prev, filters, page: 1 })) // Reset to first page
  }

  const setSorting = (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    setOptions(prev => ({ ...prev, sortBy, sortOrder }))
  }

  return {
    options,
    goToPage,
    changePageSize,
    nextPage,
    previousPage,
    resetPagination,
    setFilters,
    setSorting,
    paginationParams: createPaginationParams(options)
  }
}

// Import React for the hook
import React from 'react'

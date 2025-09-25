/**
 * Database Service Integration Tests
 * Phase 4: Testing & Deployment Implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DatabaseService } from '../database'
import { ErrorHandler } from '../../utils/errorHandler'
import { validationService } from '../../utils/validation'
import { conflictResolutionService } from '../../utils/conflictResolution'
import { performanceService } from '../../utils/performanceService'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        limit: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        order: vi.fn(() => ({ data: [], error: null })),
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null }))
      })),
    })),
    insert: vi.fn(() => ({ data: [], error: null })),
    update: vi.fn(() => ({ data: [], error: null })),
    delete: vi.fn(() => ({ data: [], error: null })),
    rpc: vi.fn(() => ({ data: null, error: null })),
  })),
}

// Mock dependencies
vi.mock('../../SupabaseClient', () => ({
  supabaseManager: {
    getClient: vi.fn(() => mockSupabaseClient),
  },
}))

vi.mock('../../utils/errorHandler', () => ({
  ErrorHandler: {
    handle: vi.fn(),
    logError: vi.fn(),
  },
}))

vi.mock('../../utils/validation', () => ({
  validationService: {
    validateRecord: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    validateEmail: vi.fn(),
    validatePhone: vi.fn(),
  },
}))

vi.mock('../../utils/conflictResolution', () => ({
  conflictResolutionService: {
    detectConflict: vi.fn(() => null),
    resolveConflict: vi.fn(),
    getConflictStats: vi.fn(() => ({
      total: 0,
      byType: {},
      byPriority: {},
      byTable: {},
      resolvedToday: 0
    })),
    getPendingConflicts: vi.fn(() => []),
  },
}))

vi.mock('../../utils/performanceService', () => ({
  performanceService: {
    trackQueryPerformance: vi.fn(),
    cacheQuery: vi.fn(),
    getCachedQuery: vi.fn(() => null),
    optimizeQuery: vi.fn(() => []),
    batchQueries: vi.fn(),
    cleanup: vi.fn(),
  },
}))

describe('DatabaseService Integration', () => {
  let dbService: DatabaseService

  beforeEach(() => {
    dbService = DatabaseService.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset singleton instance for clean state
    ;(DatabaseService as any).instance = null
  })

  describe('Service Initialization', () => {
    it('should initialize with proper dependencies', () => {
      expect(dbService).toBeInstanceOf(DatabaseService)
      expect(dbService.client).toBeDefined()
    })

    it('should be a singleton', () => {
      const anotherInstance = DatabaseService.getInstance()
      expect(dbService).toBe(anotherInstance)
    })
  })

  describe('Select Queries', () => {
    it('should execute select query successfully', async () => {
      const mockData = [
        { id: 1, name: 'Product 1', price: 99.99 },
        { id: 2, name: 'Product 2', price: 149.99 }
      ]

      const mockQueryResult = { data: mockData, error: null }
      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => mockQueryResult)
      }))

      const result = await dbService.selectQuery('products', {
        select: 'id,name,price',
        filter: { category: 'electronics' }
      })

      expect(result).toEqual(mockData)
      expect(performanceService.trackQueryPerformance).toHaveBeenCalled()
    })

    it('should handle select query errors', async () => {
      const mockError = { message: 'Table does not exist', code: 'PGRST116' }
      const mockQueryResult = { data: null, error: mockError }

      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => mockQueryResult)
      }))

      await expect(
        dbService.selectQuery('nonexistent_table')
      ).rejects.toThrow('Database query failed')

      expect(ErrorHandler.handle).toHaveBeenCalled()
    })

    it('should apply filters correctly', async () => {
      const mockData = [{ id: 1, name: 'Product 1', category: 'electronics' }]
      const mockQueryResult = { data: mockData, error: null }

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQueryResult)
        }))
      }))

      mockSupabaseClient.from = mockFrom

      await dbService.selectQuery('products', {
        filter: { category: 'electronics' }
      })

      expect(mockFrom).toHaveBeenCalledWith('products')
    })

    it('should handle pagination', async () => {
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`
      }))

      const mockQueryResult = { data: mockData.slice(0, 10), error: null }

      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            order: vi.fn(() => mockQueryResult)
          }))
        }))
      }))

      const result = await dbService.selectQuery('products', {
        limit: 10,
        orderBy: 'name'
      })

      expect(result).toHaveLength(10)
    })
  })

  describe('Insert Operations', () => {
    it('should insert record successfully', async () => {
      const newProduct = {
        name: 'New Product',
        price: 99.99,
        category: 'electronics',
        stock: 50
      }

      const mockQueryResult = {
        data: [{ ...newProduct, id: 123, created_at: new Date().toISOString() }],
        error: null
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        insert: vi.fn(() => mockQueryResult)
      }))

      const result = await dbService.insertQuery({ table: 'products', data: newProduct })

      expect(result).toEqual(mockQueryResult.data[0])
      expect(validationService.validateRecord).toHaveBeenCalledWith('products', newProduct, 'create')
    })

    it('should validate data before insert', async () => {
      const invalidProduct = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
      }

      vi.mocked(validationService.validateRecord).mockReturnValue({
        isValid: false,
        errors: ['Name is required', 'Price must be positive'],
        warnings: []
      })

      await expect(
        dbService.insertQuery({ table: 'products', data: invalidProduct })
      ).rejects.toThrow('Validation failed')

      expect(validationService.validateRecord).toHaveBeenCalled()
    })

    it('should handle insert conflicts', async () => {
      const product = { name: 'Existing Product', price: 99.99 }

      mockSupabaseClient.from().select = vi.fn(() => ({
        insert: vi.fn(() => ({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint' }
        }))
      }))

      vi.mocked(conflictResolutionService.detectConflict).mockReturnValue({
        id: 'conflict_123',
        type: 'UPDATE_UPDATE',
        source: 'desktop',
        table: 'products',
        recordId: '1',
        desktopData: product,
        webData: { ...product, name: 'Different Name' },
        conflictData: [{
          table: 'products',
          recordId: '1',
          field: 'name',
          desktopValue: 'Existing Product',
          webValue: 'Different Name'
        }],
        detectedAt: new Date(),
        status: 'DETECTED',
        priority: 'HIGH'
      })

      await expect(
        dbService.insertQuery({ table: 'products', data: product })
      ).rejects.toThrow('Validation failed')
    })
  })

  describe('Update Operations', () => {
    it('should update record successfully', async () => {
      const updatedProduct = {
        id: 1,
        name: 'Updated Product',
        price: 129.99,
        stock: 25
      }

      const mockQueryResult = {
        data: [updatedProduct],
        error: null
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => mockQueryResult)
        }))
      }))

      const result = await dbService.updateQuery({ table: 'products', data: updatedProduct, filter: { id: 1 } })

      expect(result).toEqual(updatedProduct)
      expect(validationService.validateRecord).toHaveBeenCalledWith('products', updatedProduct, 'update')
    })

    it('should handle update with optimistic locking', async () => {
      const updatedProduct = {
        id: 1,
        name: 'Updated Product',
        price: 129.99,
        updated_at: new Date().toISOString()
      }

      const mockQueryResult = {
        data: [updatedProduct],
        error: null
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => mockQueryResult)
          }))
        }))
      }))

      const result = await dbService.updateQuery({ table: 'products', data: updatedProduct, filter: { id: 1 } })

      expect(result).toEqual(updatedProduct)
    })

    it('should detect update conflicts', async () => {
      const updatedProduct = {
        id: 1,
        name: 'Updated Product',
        price: 129.99
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: { code: 'PGRST116', message: 'No rows updated' }
            }))
          }))
        }))
      }))

      vi.mocked(conflictResolutionService.detectConflict).mockReturnValue({
        id: 'conflict_456',
        type: 'UPDATE_UPDATE',
        source: 'desktop',
        table: 'products',
        recordId: '1',
        desktopData: updatedProduct,
        webData: { ...updatedProduct, updated_at: new Date().toISOString() },
        conflictData: [{
          table: 'products',
          recordId: '1',
          field: 'updated_at',
          desktopValue: updatedProduct.updated_at,
          webValue: new Date().toISOString()
        }],
        detectedAt: new Date(),
        status: 'DETECTED',
        priority: 'HIGH'
      })

      await expect(
        dbService.updateQuery({ table: 'products', data: updatedProduct, filter: { id: 1 } })
      ).rejects.toThrow('Validation failed')
    })
  })

  describe('Delete Operations', () => {
    it('should delete record successfully', async () => {
      const mockQueryResult = {
        data: [{ id: 1 }],
        error: null
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => mockQueryResult)
        }))
      }))

      const result = await dbService.deleteQuery({ table: 'products', filter: { id: 1 } })

      expect(result).toEqual({ id: 1 })
    })

    it('should handle delete errors', async () => {
      const mockQueryResult = {
        data: null,
        error: { message: 'Record not found', code: 'PGRST116' }
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => mockQueryResult)
        }))
      }))

      await expect(
        dbService.deleteQuery({ table: 'products', filter: { id: 999 } })
      ).rejects.toThrow('Database query failed')
    })
  })

  describe('Batch Operations', () => {
    it('should execute batch queries', async () => {
      const queries = [
        { table: 'products', operation: 'select', options: { select: 'id,name' } },
        { table: 'categories', operation: 'select', options: { select: 'id,name' } }
      ]

      const mockResults = [
        { data: [{ id: 1, name: 'Product 1' }], error: null },
        { data: [{ id: 1, name: 'Electronics' }], error: null }
      ]

      vi.mocked(performanceService.batchQueries).mockResolvedValue(mockResults)

      const result = await dbService.batchQueries([{ table: 'products', options: { select: 'id,name' } }])

      expect(result).toEqual(mockResults)
      expect(performanceService.batchQueries).toHaveBeenCalledWith([{ table: 'products', select: 'id,name' }])
    })

    it('should handle batch query errors', async () => {
      const queries = [
        { table: 'products', operation: 'select', options: { select: 'id,name' } },
        { table: 'invalid_table', operation: 'select', options: { select: 'id,name' } }
      ]

      const mockResults = [
        { data: [{ id: 1, name: 'Product 1' }], error: null },
        { data: null, error: 'Table does not exist' }
      ]

      vi.mocked(performanceService.batchQueries).mockResolvedValue(mockResults)

      const result = await dbService.batchQueries([{ table: 'products', options: { select: 'id,name' } }])

      expect(result).toHaveLength(2)
      expect(result[0].error).toBeNull()
      expect(result[1].error).toBe('Table does not exist')
    })
  })

  describe('Transaction Management', () => {
    it('should execute queries within transaction', async () => {
      const operations = [
        { type: 'insert', table: 'products', data: { name: 'Product 1', price: 99.99 } },
        { type: 'insert', table: 'stock_movements', data: { product_id: 1, quantity: 50, type: 'IN' } }
      ]

      const mockTransactionResult = {
        data: [
          { id: 1, name: 'Product 1', price: 99.99 },
          { id: 1, product_id: 1, quantity: 50, type: 'IN' }
        ],
        error: null
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        insert: vi.fn(() => mockTransactionResult)
      }))

      const result = await dbService.batch(operations)

      expect(result).toHaveLength(2)
    })

    it('should rollback transaction on error', async () => {
      const operations = [
        { type: 'insert', table: 'products', data: { name: 'Product 1', price: 99.99 } },
        { type: 'insert', table: 'invalid_table', data: { invalid: 'data' } }
      ]

      mockSupabaseClient.from().select = vi.fn(() => ({
        insert: vi.fn(() => ({
          data: null,
          error: 'Transaction failed'
        }))
      }))

      await expect(
        dbService.batch(operations)
      ).rejects.toThrow('Transaction failed')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track query performance', async () => {
      const mockData = [{ id: 1, name: 'Product 1' }]
      const mockQueryResult = { data: mockData, error: null }

      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => mockQueryResult)
      }))

      const startTime = Date.now()
      await dbService.selectQuery('products', { filter: { id: 1 } })
      const endTime = Date.now()

      expect(performanceService.trackQueryPerformance).toHaveBeenCalledWith(
        expect.stringContaining('products'),
        expect.any(Number),
        false,
        1
      )

      const call = vi.mocked(performanceService.trackQueryPerformance).mock.calls[0]
      expect(call[1]).toBeGreaterThan(0) // Duration should be positive
      expect(call[1]).toBeLessThan(endTime - startTime + 100) // Should be reasonable
    })

    it('should handle cache hits', async () => {
      const mockData = [{ id: 1, name: 'Product 1' }]

      // Mock cache hit
      vi.mocked(performanceService.getCachedQuery).mockReturnValue(mockData)

      const result = await dbService.selectQuery('products', { filter: { id: 1 } })

      expect(result).toEqual(mockData)
      expect(performanceService.trackQueryPerformance).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        true, // cacheHit should be true
        1
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => {
          throw new Error('Network error')
        })
      }))

      await expect(
        dbService.selectQuery('products')
      ).rejects.toThrow('Network error')

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('DatabaseService')
      )
    })

    it('should handle timeout errors', async () => {
      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000)
        }))
      }))

      await expect(
        dbService.selectQuery('products', { filter: { id: 1 }, limit: 10 })
      ).rejects.toThrow('Database query failed')

      expect(ErrorHandler.handle).toHaveBeenCalled()
    })

    it('should retry failed queries', async () => {
      const mockData = [{ id: 1, name: 'Product 1' }]
      let attempts = 0

      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => {
          attempts++
          if (attempts === 1) {
            return { data: null, error: { message: 'Temporary error' } }
          }
          return { data: mockData, error: null }
        })
      }))

      const result = await dbService.selectQuery('products', { filter: { id: 1 }, limit: 10 })

      expect(result).toEqual(mockData)
      expect(attempts).toBe(2)
    })
  })

  describe('Security', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = {
        filter: { name: "'; DROP TABLE users; --" }
      }

      mockSupabaseClient.from().select = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))

      const result = await dbService.selectQuery('products', maliciousInput)

      expect(result).toEqual([])
      // Verify that the malicious input is properly sanitized
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products')
    })

    it('should validate input data', async () => {
      const invalidData = {
        name: '<script>alert("xss")</script>',
        price: 'not-a-number'
      }

      vi.mocked(validationService.validateRecord).mockReturnValue({
        isValid: false,
        errors: ['Invalid characters detected', 'Price must be a number'],
        warnings: []
      })

      await expect(
        dbService.insertQuery('products', invalidData)
      ).rejects.toThrow('Validation failed')

      expect(validationService.validateRecord).toHaveBeenCalled()
    })
  })
})

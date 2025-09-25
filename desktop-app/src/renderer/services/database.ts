/**
 * Simple Database Service - No over engineering
 */

import { supabaseManager } from '../SupabaseClient'
import { ErrorHandler } from '../utils/errorHandler'
import { validationService } from '../utils/validation'

export interface QueryOptions {
  select?: string
  filter?: Record<string, any>
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface InsertOptions {
  returning?: string
}

export interface UpdateOptions {
  returning?: string
}

export class DatabaseService {
  private client: any

  constructor() {
    this.client = supabaseManager.getClient()
  }

  /**
   * Select data from table
   */
  public async select(table: string, options: QueryOptions = {}) {
    try {
      let query = this.client.from(table)

      if (options.select) {
        query = query.select(options.select)
      }

      if (options.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          query = query.eq(key, value)
        }
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
      }

      const { data, error } = await query

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.select(${table})`)
        return []
      }

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.select(${table})`)
      return []
    }
  }

  /**
   * Insert data into table
   */
  public async insert(table: string, data: any, options: InsertOptions = {}) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select(options.returning || '*')

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.insert(${table})`)
        return null
      }

      return result?.[0] || null
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.insert(${table})`)
      return null
    }
  }

  /**
   * Update data in table
   */
  public async update(table: string, id: string, data: any, options: UpdateOptions = {}) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select(options.returning || '*')

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.update(${table})`)
        return null
      }

      return result?.[0] || null
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.update(${table})`)
      return null
    }
  }

  /**
   * Delete data from table
   */
  public async delete(table: string, id: string) {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.delete(${table})`)
        return false
      }

      return true
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.delete(${table})`)
      return false
    }
  }

  /**
   * Get single record by ID
   */
  public async getById(table: string, id: string) {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.getById(${table})`)
        return null
      }

      return data
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.getById(${table})`)
      return null
    }
  }

  /**
   * Count records in table
   */
  public async count(table: string, filter?: Record<string, any>) {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true })

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value)
        }
      }

      const { count, error } = await query

      if (error) {
        ErrorHandler.handle(error, `DatabaseService.count(${table})`)
        return 0
      }

      return count || 0
    } catch (error) {
      ErrorHandler.handle(error, `DatabaseService.count(${table})`)
      return 0
    }
  }

  /**
   * Validate table name
   */
  private isValidTable(table: string): boolean {
    const validTables = ['customers', 'products', 'orders', 'order_items', 'raw_materials', 'product_recipes', 'suppliers']
    return validTables.includes(table)
  }

  /**
   * Validate column name
   */
  private isValidColumn(column: string): boolean {
    // Basic validation - no special characters except underscore
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(column)
  }
}

export const dbService = new DatabaseService()

export default DatabaseService
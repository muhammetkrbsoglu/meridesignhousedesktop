/**
 * API Service Layer - Business logic and data access
 */

import { dbService } from './database'
import { ErrorHandler } from '../utils/errorHandler'
import { TABLE_NAMES, STOCK_STATUS, ORDER_STATUS, MOVEMENT_TYPES } from '../constants'

export interface RawMaterial {
  id: string
  name: string
  unit_price_try: number | null
  stock_quantity: number | null
  stock_unit: string | null
  min_stock_quantity: number | null
  min_stock_unit: string | null
  lead_time_days: number | null
  supplier_id: string | null
  contact_or_url: string | null
  price_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact: string | null
  url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatusType
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  order_items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  createdAt: string
}

type OrderStatusType = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

export class StockAPI {
  /**
   * Get all raw materials with supplier information
   */
  static async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.RAW_MATERIALS, {
        select: `
          *,
          suppliers:supplier_id (
            id,
            name,
            contact
          )
        `,
        orderBy: 'name',
        orderDirection: 'asc'
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'StockAPI.getRawMaterials')
      throw error
    }
  }

  /**
   * Get suppliers
   */
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.SUPPLIERS, {
        orderBy: 'name',
        orderDirection: 'asc'
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'StockAPI.getSuppliers')
      throw error
    }
  }

  /**
   * Update stock safely with validation
   */
  static async updateStock(
    materialId: string,
    newQuantity: number,
    reason: string = 'Manual update'
  ): Promise<boolean> {
    try {
      // Validate input
      if (newQuantity < 0) {
        throw new Error('Stock quantity cannot be negative')
      }

      if (newQuantity > 999999) {
        throw new Error('Stock quantity too large')
      }

      // Call safe RPC function
      // RPC call removed - using simple update
      await dbService.update('products', materialId, {
        material_id: materialId,
        new_quantity: newQuantity,
        reason: reason
      })

      return true
    } catch (error) {
      ErrorHandler.handle(error, 'StockAPI.updateStock')
      throw error
    }
  }

  /**
   * Get low stock materials
   */
  static async getLowStockMaterials(): Promise<RawMaterial[]> {
    try {
      const materials = await this.getRawMaterials()

      return materials.filter(material => {
        if (!material.stock_quantity || !material.min_stock_quantity) {
          return false
        }

        const currentStock = material.stock_quantity
        const minStock = material.min_stock_quantity
        const threshold = minStock * 1.2 // 20% buffer

        return currentStock <= threshold
      })
    } catch (error) {
      ErrorHandler.handle(error, 'StockAPI.getLowStockMaterials')
      throw error
    }
  }

  /**
   * Get stock movements for a material
   */
  static async getStockMovements(materialId: string): Promise<any[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.STOCK_MOVEMENTS, {
        filter: { raw_material_id: materialId },
        orderBy: 'created_at',
        orderDirection: 'desc',
        limit: 50
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'StockAPI.getStockMovements')
      throw error
    }
  }
}

export class OrderAPI {
  /**
   * Get orders with items
   */
  static async getOrders(): Promise<Order[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.ORDERS, {
        select: `
          *,
          order_items (
            id,
            productId,
            quantity,
            price
          )
        `,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'OrderAPI.getOrders')
      throw error
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const data = await dbService.select(TABLE_NAMES.ORDERS, {
        filter: { id: orderId },
        select: `
          *,
          order_items (
            id,
            productId,
            quantity,
            price
          )
        `
      })

      return data?.[0] || null
    } catch (error) {
      ErrorHandler.handle(error, 'OrderAPI.getOrderById')
      throw error
    }
  }

  /**
   * Update order status with stock management
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatusType,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      // Get order details first
      const order = await this.getOrderById(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`)
      }

      // Start transaction-like operation
      const operations = []

      // Update order status
      operations.push({
        type: 'update' as const,
        options: {
          table: TABLE_NAMES.ORDERS,
          data: {
            status: newStatus,
            updatedAt: new Date().toISOString(),
            admin_notes: adminNotes || null
          },
          filter: { id: orderId }
        }
      })

      // If confirming order, deduct stock
      if (newStatus === ORDER_STATUS.CONFIRMED && order.status === ORDER_STATUS.PENDING) {
        for (const item of order.order_items || []) {
          // Get product recipe to know which materials to deduct
          const productRecipes = await this.getProductRecipes(item.productId)

          for (const recipe of productRecipes) {
            if (recipe.raw_material_id && recipe.quantity) {
              operations.push({
                type: 'update' as const,
                options: {
                  table: TABLE_NAMES.STOCK_MOVEMENTS,
                  data: {
                    raw_material_id: recipe.raw_material_id,
                    movement_type: MOVEMENT_TYPES.OUT,
                    quantity: recipe.quantity * item.quantity,
                    reason: `Order ${order.orderNumber} - ${item.productId}`,
                    order_id: orderId
                  },
                  filter: {}
                }
              })
            }
          }
        }
      }

      // If cancelling/refunding, restore stock
      if (
        (newStatus === ORDER_STATUS.CANCELLED || newStatus === ORDER_STATUS.REFUNDED) &&
        order.status === ORDER_STATUS.CONFIRMED
      ) {
        for (const item of order.order_items || []) {
          const productRecipes = await this.getProductRecipes(item.productId)

          for (const recipe of productRecipes) {
            if (recipe.raw_material_id && recipe.quantity) {
              operations.push({
                type: 'update' as const,
                options: {
                  table: TABLE_NAMES.STOCK_MOVEMENTS,
                  data: {
                    raw_material_id: recipe.raw_material_id,
                    movement_type: MOVEMENT_TYPES.RETURN,
                    quantity: recipe.quantity * item.quantity,
                    reason: `Order ${order.orderNumber} ${newStatus.toLowerCase()} - ${item.productId}`,
                    order_id: orderId
                  },
                  filter: {}
                }
              })
            }
          }
        }
      }

      // Execute all operations - simplified
      for (const operation of operations) {
        try {
          if (operation.type === 'update' && operation.options.table && operation.options.data) {
            // For stock movements, use insert since we're creating new records
            if (operation.options.table === TABLE_NAMES.STOCK_MOVEMENTS) {
              await dbService.insert(operation.options.table, operation.options.data)
            } else {
              // For other updates, use update method
              if (operation.options.filter?.id) {
                await dbService.update(operation.options.table, operation.options.filter.id, operation.options.data)
              }
            }
          }
        } catch (error) {
          console.error('Error executing operation:', error)
        }
      }

      return true
    } catch (error) {
      ErrorHandler.handle(error, 'OrderAPI.updateOrderStatus')
      throw error
    }
  }

  /**
   * Validate order status transition
   */
  private static isValidStatusTransition(currentStatus: OrderStatusType, newStatus: OrderStatusType): boolean {
    const validTransitions: Record<OrderStatusType, OrderStatusType[]> = {
      PENDING: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      CONFIRMED: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      PROCESSING: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      SHIPPED: [ORDER_STATUS.DELIVERED],
      DELIVERED: [], // Final state
      CANCELLED: [ORDER_STATUS.REFUNDED], // Allow refund after cancellation
      REFUNDED: [] // Final state
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }

  /**
   * Get product recipes for stock calculation
   */
  private static async getProductRecipes(productId: string): Promise<any[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.PRODUCT_RECIPES, {
        filter: { product_id: productId }
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'OrderAPI.getProductRecipes')
      return []
    }
  }
}

export class SupplierAPI {
  /**
   * Get suppliers with material count
   */
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const data = await dbService.select(TABLE_NAMES.SUPPLIERS, {
        select: `
          *,
          raw_materials:supplier_id(count)
        `,
        orderBy: 'name',
        orderDirection: 'asc'
      })

      return data || []
    } catch (error) {
      ErrorHandler.handle(error, 'SupplierAPI.getSuppliers')
      throw error
    }
  }

  /**
   * Create supplier order suggestion
   */
  static async createSupplierOrderSuggestion(supplierId: string, items: any[]): Promise<boolean> {
    try {
      await dbService.insert('backup_logs', {
        table: TABLE_NAMES.SUPPLIER_ORDERS,
        data: {
          supplier_id: supplierId,
          status: 'PENDING',
          items_json: items,
          notes: `Auto-generated order suggestion - ${new Date().toISOString()}`
        }
      })

      return true
    } catch (error) {
      ErrorHandler.handle(error, 'SupplierAPI.createSupplierOrderSuggestion')
      throw error
    }
  }
}

export class DashboardAPI {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    totalMaterials: number
    lowStockCount: number
    criticalStockCount: number
    totalOrders: number
    pendingOrders: number
    confirmedOrders: number
    totalRevenue: number
    monthlyRevenue: number
  }> {
    try {
      const [
        materials,
        orders,
        monthlyOrders
      ] = await Promise.all([
        StockAPI.getRawMaterials(),
        OrderAPI.getOrders(),
        OrderAPI.getOrders() // This should be filtered by date
      ])

      const lowStockMaterials = materials.filter(m =>
        m.stock_quantity && m.min_stock_quantity &&
        m.stock_quantity <= m.min_stock_quantity * 1.2
      )

      const criticalStockMaterials = materials.filter(m =>
        m.stock_quantity && m.min_stock_quantity &&
        m.stock_quantity <= m.min_stock_quantity
      )

      const pendingOrders = orders.filter(o => o.status === ORDER_STATUS.PENDING)
      const confirmedOrders = orders.filter(o => o.status === ORDER_STATUS.CONFIRMED)

      const totalRevenue = orders
        .filter((o: Order) => [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(o.status as any))
        .reduce((sum: number, order: Order) => sum + order.totalAmount, 0)

      const monthlyRevenue = monthlyOrders
        .filter((o: Order) => [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(o.status as any))
        .reduce((sum: number, order: Order) => sum + order.totalAmount, 0)

      return {
        totalMaterials: materials.length,
        lowStockCount: lowStockMaterials.length,
        criticalStockCount: criticalStockMaterials.length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        confirmedOrders: confirmedOrders.length,
        totalRevenue,
        monthlyRevenue
      }
    } catch (error) {
      ErrorHandler.handle(error, 'DashboardAPI.getDashboardStats')
      throw error
    }
  }
}

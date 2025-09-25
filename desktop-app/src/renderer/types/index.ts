/**
 * Global TypeScript type definitions
 * Ensures type safety across the application
 */

import { OrderStatusType, MovementType, RecipeItemType } from '../constants'

// Base entity interface
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// User types
export interface User extends BaseEntity {
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'user'
}

// Raw Materials
export interface RawMaterial extends BaseEntity {
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
  supplier?: Supplier
  stock_movements?: StockMovement[]
}

// Suppliers
export interface Supplier extends BaseEntity {
  name: string
  contact: string | null
  url: string | null
  notes: string | null
  raw_materials?: RawMaterial[]
  supplier_orders?: SupplierOrder[]
}

// Products
export interface Product extends BaseEntity {
  name: string
  description?: string
  price: number
  category?: string
  sku?: string
  image_url?: string
  is_active: boolean
  product_recipes?: ProductRecipe[]
  order_items?: OrderItem[]
}

// Product Recipes (Bill of Materials)
export interface ProductRecipe extends BaseEntity {
  product_id: string
  raw_material_id: string | null
  quantity: number
  unit: string
  item_type: RecipeItemType
  cost_percentage?: number
  notes?: string
  product?: Product
  raw_material?: RawMaterial
}

// Orders
export interface Order extends BaseEntity {
  orderNumber: string
  userId: string
  status: OrderStatusType
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  admin_notes?: string
  order_items?: OrderItem[]
}

// Order Items
export interface OrderItem extends BaseEntity {
  orderId: string
  productId: string
  quantity: number
  price: number
  order?: Order
  product?: Product
}

// Stock Movements
export interface StockMovement extends BaseEntity {
  raw_material_id: string
  movement_type: MovementType
  quantity: number
  reason: string
  order_id?: string
  notes?: string
  raw_material?: RawMaterial
  order?: Order
}

// Supplier Orders
export interface SupplierOrder extends BaseEntity {
  supplier_id: string
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  items_json: any[]
  total_amount?: number
  expected_date?: string
  notes?: string
  supplier?: Supplier
}

// Price Rules for automatic pricing
export interface PriceRule extends BaseEntity {
  name: string
  description?: string
  rule_type: 'markup' | 'margin' | 'fixed'
  value: number
  is_active: boolean
  conditions?: Record<string, any>
}

// Dashboard Statistics
export interface DashboardStats {
  totalMaterials: number
  lowStockCount: number
  criticalStockCount: number
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  totalRevenue: number
  monthlyRevenue: number
}

// API Response types
export interface APIResponse<T = any> {
  data: T
  error: null
  status: number
  statusText: string
}

export interface APIError {
  data: null
  error: {
    message: string
    code?: string
    details?: string
  }
  status: number
  statusText: string
}

export type APIResult<T = any> = APIResponse<T> | APIError

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
  }
}

export interface FormData {
  [key: string]: any
}

export interface FormErrors {
  [key: string]: string[]
}

// Pagination types
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

// Table types
export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T) => React.ReactNode
  width?: string | number
}

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: PaginationOptions
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  onRowClick?: (record: T) => void
  rowKey?: keyof T | ((record: T) => string)
}

// Component prop types
export interface SearchableListProps<T = any> {
  data: T[]
  searchFields: (keyof T)[]
  placeholder?: string
  onSearch?: (filtered: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  loading?: boolean
  emptyMessage?: string
}

export interface FilterableTableProps<T = any> extends TableProps<T> {
  filters?: Record<string, any>
  onFiltersChange?: (filters: Record<string, any>) => void
  filterOptions?: Record<string, Array<{ label: string; value: any }>>
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Event handler types
export type ChangeHandler<T = any> = (value: T) => void
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>
export type ClickHandler<T = any> = (event: React.MouseEvent, data?: T) => void

// Theme and UI types
export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  errorColor: string
  successColor: string
  warningColor: string
}

export interface UIConfig {
  borderRadius: number
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  breakpoints: {
    sm: number
    md: number
    lg: number
    xl: number
  }
}

// Import React for JSX elements
import React from 'react'

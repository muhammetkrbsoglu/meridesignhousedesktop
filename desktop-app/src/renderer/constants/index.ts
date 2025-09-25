/**
 * Application constants and configuration
 */

const preloadEnv = (globalThis as any)?.mdh?.env || {}
export const APP_CONFIG = {
  NAME: 'Meri Design House Desktop',
  VERSION: '1.0.0',
  DESCRIPTION: 'Stock and Order Management System',
  AUTHOR: 'Meri Design House',
  ENVIRONMENT: (import.meta as any)?.env?.VITE_ENVIRONMENT || preloadEnv.VITE_ENVIRONMENT || 'development'
} as const

export const VALIDATION_RULES = {
  TEXT: {
    MAX_LENGTH: 255,
    MIN_LENGTH: 0
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  PHONE: {
    LENGTH: 10,
    PATTERN: /^(05\d{9}|5\d{9})$/
  },
  URL: {
    PROTOCOLS: ['http:', 'https:', 'ftp:'] as const
  },
  NUMBER: {
    MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
    DEFAULT_DECIMALS: 2
  }
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const

export const STOCK_STATUS = {
  KRITIK: 'KRITIK',
  DUSUK: 'DÜŞÜK',
  NORMAL: 'NORMAL'
} as const

export const STOCK_THRESHOLDS = {
  KRITIK_PERCENTAGE: 100, // <= min stock
  DUSUK_PERCENTAGE: 120,  // <= min stock + 20%
  REORDER_BUFFER: 20 // 20% buffer for reorder suggestions
} as const

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  READY_TO_SHIP: 'READY_TO_SHIP'
} as const

export const MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN'
} as const

export const RECIPE_ITEM_TYPES = {
  MATERIAL: 'MATERIAL',
  LABOR: 'LABOR'
} as const

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const

export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  BOTH: 'both'
} as const

export const BACKUP_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
} as const

export const CURRENCY = {
  CODE: 'TRY',
  SYMBOL: '₺',
  LOCALE: 'tr-TR'
} as const

export const DATE_FORMATS = {
  SHORT: 'DD.MM.YYYY',
  LONG: 'DD.MM.YYYY HH:mm:ss',
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD.MM.YYYY'
} as const

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  SKELETON_ROWS: 5,
  GRID_COLUMNS: {
    SM: 1,
    MD: 2,
    LG: 3,
    XL: 4
  }
} as const

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
  PERMISSION_DENIED: 'Bu işlem için yetkiniz yok.',
  VALIDATION_ERROR: 'Lütfen tüm zorunlu alanları doldurun.',
  SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  TIMEOUT_ERROR: 'İşlem zaman aşımına uğradı.',
  NOT_FOUND: 'İstenen veri bulunamadı.',
  DUPLICATE_ERROR: 'Bu kayıt zaten mevcut.',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu.'
} as const

export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Değişiklikler başarıyla kaydedildi.',
  DELETE_SUCCESS: 'Kayıt başarıyla silindi.',
  EXPORT_SUCCESS: 'Veriler başarıyla export edildi.',
  IMPORT_SUCCESS: 'Veriler başarıyla import edildi.',
  SYNC_SUCCESS: 'Senkronizasyon tamamlandı.'
} as const

export const TABLE_NAMES = {
  RAW_MATERIALS: 'raw_materials',
  SUPPLIERS: 'suppliers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PRODUCTS: 'products',
  PRODUCT_RECIPES: 'product_recipes',
  STOCK_MOVEMENTS: 'stock_movements',
  SUPPLIER_ORDERS: 'supplier_orders',
  PRICE_RULES: 'price_rules'
} as const

export const REALTIME_EVENTS = {
  RAW_MATERIALS_CHANGE: 'raw_materials_change',
  ORDERS_CHANGE: 'orders_change',
  STOCK_MOVEMENTS_CHANGE: 'stock_movements_change',
  SUPPLIERS_CHANGE: 'suppliers_change'
} as const

export const LOCAL_STORAGE_KEYS = {
  APP_SETTINGS: 'app-settings',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme',
  BACKUP_SETTINGS: 'backup-settings'
} as const

export const API_ENDPOINTS = {
  HEALTH_CHECK: '/health',
  VERSION_CHECK: '/version',
  BACKUP: '/backup',
  EXPORT: '/export'
} as const

// Type definitions for better type safety
export type StockStatusType = typeof STOCK_STATUS[keyof typeof STOCK_STATUS]
export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
export type MovementType = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES]
export type RecipeItemType = typeof RECIPE_ITEM_TYPES[keyof typeof RECIPE_ITEM_TYPES]
export type ThemeType = typeof THEMES[keyof typeof THEMES]
export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS]
export type BackupFrequency = typeof BACKUP_FREQUENCIES[keyof typeof BACKUP_FREQUENCIES]

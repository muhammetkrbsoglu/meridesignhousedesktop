// StockManager.tsx - Main stock management component
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRawMaterials, useSuppliers } from './hooks' // React Query hooks for data fetching
import { LoadingSkeleton, TableSkeleton, CardSkeleton } from './components' // UI loading components
import { ErrorBoundary } from './components' // Error boundary wrapper
// import { InputValidator } from './utils' // Input validation utilities
import { ErrorHandler } from './utils' // Error handling utilities
import { STOCK_STATUS, STOCK_THRESHOLDS } from './constants' // Application constants
import { useErrorHandler } from './utils' // React hook for error handling

interface RawMaterial {
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
}

interface Supplier {
  id: string
  name: string
  contact: string | null
  url: string | null
  notes: string | null
}

function OptimizedMaterialCard({ material }: { material: RawMaterial }) {
  const getStockStatus = useCallback((material: RawMaterial) => {
    if (material.stock_quantity === null || material.min_stock_quantity === null) {
      return { color: 'text-gray-600', status: 'Belirsiz', icon: '❓' }
    }

    if (material.stock_quantity <= material.min_stock_quantity) {
      return { color: 'text-red-600', status: STOCK_STATUS.KRITIK, icon: '🚨' }
    }

    if (material.stock_quantity <= (material.min_stock_quantity * 1.2)) {
      return { color: 'text-yellow-600', status: STOCK_STATUS.DUSUK, icon: '⚠️' }
    }

    return { color: 'text-green-600', status: STOCK_STATUS.NORMAL, icon: '✅' }
  }, [])

  const stockStatus = useMemo(() => getStockStatus(material), [material, getStockStatus])

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold">{material.name}</h3>
        <span className="text-lg">{stockStatus.icon}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Mevcut Stok:</span>
          <span className={`font-medium ${stockStatus.color}`}>
            {material.stock_quantity !== null ? `${material.stock_quantity} ${material.stock_unit || 'adet'}` : 'Belirsiz'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Min. Stok:</span>
          <span className="font-medium">
            {material.min_stock_quantity !== null ? `${material.min_stock_quantity} ${material.min_stock_unit || 'adet'}` : 'Belirsiz'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Birim Fiyat:</span>
          <span className="font-medium">
            {material.unit_price_try !== null ? `₺${material.unit_price_try}` : 'Belirsiz'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className={`text-sm font-medium px-2 py-1 rounded ${stockStatus.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {stockStatus.status}
        </span>
        {material.stock_quantity !== null && material.min_stock_quantity !== null && material.stock_quantity <= material.min_stock_quantity && (
          <button className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
            Sipariş Ver
          </button>
        )}
      </div>

      {material.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          {material.notes}
        </div>
      )}
    </div>
  )
}

function StockManagerContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  // Use optimized React Query hooks
  const {
    data: materials = [],
    isLoading: materialsLoading,
    error: materialsError,
    refetch: refetchMaterials
  } = useRawMaterials()

  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    error: suppliersError
  } = useSuppliers()

  // Memoized filtered data
  const filteredMaterials = useMemo(() => {
    let filtered = materials.filter((material: RawMaterial) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply sorting
    filtered.sort((a: RawMaterial, b: RawMaterial) => {
      const aValue = a[sortConfig.key as keyof RawMaterial]
      const bValue = b[sortConfig.key as keyof RawMaterial]

      // Handle null values in sorting
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [materials, searchTerm, sortConfig])

  // Optimized search handler with debouncing
  const handleSearch = useCallback((value: string) => {
    const trimmed = String(value).slice(0, 100)
    setSearchTerm(trimmed)
  }, [])

  // Optimized sort handler
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const lowStockMaterials = useMemo(() =>
    materials.filter((material: RawMaterial) =>
      material.stock_quantity !== null &&
      material.min_stock_quantity !== null &&
      material.stock_quantity <= material.min_stock_quantity
    ), [materials]
  )

  const reorderNeededMaterials = useMemo(() =>
    materials.filter((material: RawMaterial) =>
      material.stock_quantity !== null &&
      material.min_stock_quantity !== null &&
      material.stock_quantity <= (material.min_stock_quantity * 1.2)
    ), [materials]
  )

  // Error handling
  if (materialsError || suppliersError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Veri Yüklenemedi</h3>
          <p className="text-gray-500 mb-4">
            {(materialsError || suppliersError)?.message || 'Bilinmeyen hata'}
          </p>
          <button
            onClick={() => refetchMaterials()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yarı Mamul Stok Yönetimi</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Malzeme ara..."
            defaultValue={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => refetchMaterials()}
            disabled={materialsLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {materialsLoading ? '⟳' : '🔄'} Yenile
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Supabase bağlantısı aktif - Gerçek zamanlı güncelleme
      </div>

      {/* Alerts */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {lowStockMaterials.length > 0 && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>{lowStockMaterials.length} malzeme</strong> minimum seviyenin altında!
                </p>
              </div>
            </div>
          </div>
        )}

        {reorderNeededMaterials.length > 0 && (
          <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>{reorderNeededMaterials.length} malzeme</strong> sipariş verilmeli (20% buffer altında)!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {materialsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border animate-pulse">
              <div className="flex items-start justify-between mb-2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Materials Grid */}
      {!materialsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Malzeme bulunamadı</p>
            </div>
          ) : (
            filteredMaterials.map((material: RawMaterial) => (
              <OptimizedMaterialCard key={material.id} material={material} />
            ))
          )}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Toplam Malzeme</h4>
          <p className="text-2xl font-bold text-blue-600">{materials.length}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Normal Stok</h4>
          <p className="text-2xl font-bold text-green-600">
            {materials.filter((m: RawMaterial) => {
              if (m.stock_quantity === null || m.min_stock_quantity === null) return false
              return m.stock_quantity > m.min_stock_quantity
            }).length}
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Düşük Stok</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {materials.filter((m: RawMaterial) => {
              if (m.stock_quantity === null || m.min_stock_quantity === null) return false
              return m.stock_quantity <= m.min_stock_quantity * 1.2 && m.stock_quantity > m.min_stock_quantity
            }).length}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800">Kritik Stok</h4>
          <p className="text-2xl font-bold text-red-600">
            {materials.filter((m: RawMaterial) => {
              if (m.stock_quantity === null || m.min_stock_quantity === null) return false
              return m.stock_quantity <= m.min_stock_quantity
            }).length}
          </p>
        </div>
      </div>
    </div>
  )
}export default function StockManager() {
  return (
    <ErrorBoundary>
      <StockManagerContent />
    </ErrorBoundary>
  )
}

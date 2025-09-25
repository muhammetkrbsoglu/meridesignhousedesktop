import React, { useState, useEffect } from 'react'
import supabase from './SupabaseClient'
import type { RawMaterial, Order } from './services/api'

interface StockReport {
  material_id: string
  material_name: string
  stock_quantity: number
  min_stock_quantity: number
  unit_price: number
  total_value: number
  status: 'KRITIK' | 'DÜŞÜK' | 'NORMAL'
}

interface SalesReport {
  order_id: string
  order_number: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  item_count: number
}

interface ProfitReport {
  product_name: string
  product_price: number
  material_cost: number
  margin: number
  margin_percent: number
}

export default function ReportsManager() {
  const [stockReport, setStockReport] = useState<StockReport[]>([])
  const [salesReport, setSalesReport] = useState<SalesReport[]>([])
  const [profitReport, setProfitReport] = useState<ProfitReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('stock')
  const [dateRange, setDateRange] = useState('today')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [reportType, dateRange])

  const loadReports = async () => {
    try {
      setLoading(true)
      if (reportType === 'stock') {
        await loadStockReport()
      } else if (reportType === 'sales') {
        await loadSalesReport()
      } else if (reportType === 'profit') {
        await loadProfitReport()
      }
    } catch (error) {
      console.error('Rapor yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStockReport = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name')

      if (error) throw error

      const reportData: StockReport[] = (data || []).map((material: RawMaterial) => {
        const stock_quantity = material.stock_quantity || 0
        const min_stock_quantity = material.min_stock_quantity || 0
        const unit_price = material.unit_price_try || 0
        const total_value = stock_quantity * unit_price

        let status: 'KRITIK' | 'DÜŞÜK' | 'NORMAL' = 'NORMAL'
        if (stock_quantity <= min_stock_quantity) {
          status = 'KRITIK'
        } else if (stock_quantity <= min_stock_quantity * 1.2) {
          status = 'DÜŞÜK'
        }

        return {
          material_id: material.id,
          material_name: material.name,
          stock_quantity,
          min_stock_quantity,
          unit_price,
          total_value,
          status
        }
      })

      setStockReport(reportData)
      console.log('✅ Stok raporu yüklendi:', reportData.length, 'malzeme')
    } catch (error) {
      console.error('❌ Stok raporu yüklenirken hata:', error)
      setStockReport([])
    }
  }

  const loadSalesReport = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })

      // Supabase syntax ile tarih filtreleme
      switch (dateRange) {
        case 'today':
          query = query.gte('created_at', today.toISOString())
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(today.getDate() - 7)
          query = query.gte('created_at', weekAgo.toISOString())
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(today.getMonth() - 1)
          query = query.gte('created_at', monthAgo.toISOString())
          break
        default:
          // Tüm veriler
          break
      }

      const { data, error } = await query

      if (error) throw error

      const reportData: SalesReport[] = (data || []).map((order: Order) => ({
        order_id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        total_amount: order.totalAmount,
        status: order.status,
        created_at: order.createdAt,
        item_count: order.order_items?.length || 0
      }))

      setSalesReport(reportData)
      console.log('✅ Satış raporu yüklendi:', reportData.length, 'sipariş')
    } catch (error) {
      console.error('❌ Satış raporu yüklenirken hata:', error)
      setSalesReport([])
    }
  }

  const loadProfitReport = async () => {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')

      if (productsError) throw productsError

      const { data: recipes, error: recipesError } = await supabase
        .from('product_raw_material_relations')
        .select(`
          *,
          raw_materials (name, unit_price_try)
        `)

      if (recipesError) throw recipesError

      const reportData: ProfitReport[] = (products || []).map((product: any) => {
        const productRecipes = recipes?.filter((r: any) => r.product_id === product.id) || []
        const materialCost = productRecipes.reduce((total: number, recipe: any) => {
          if (recipe.raw_materials && recipe.quantity) {
            const unitPrice = recipe.raw_materials.unit_price_try || 0
            return total + (unitPrice * recipe.quantity)
          }
          return total
        }, 0)

        const margin = product.price - materialCost
        const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0

        return {
          product_name: product.name,
          product_price: product.price,
          material_cost: materialCost,
          margin,
          margin_percent: marginPercent
        }
      })

      setProfitReport(reportData)
      console.log('✅ Kar marjı raporu yüklendi:', reportData.length, 'ürün')
    } catch (error) {
      console.error('❌ Kar raporu yüklenirken hata:', error)
      setProfitReport([])
    }
  }

  const exportToCSV = async (data: any[], filename: string) => {
    try {
      setExportLoading(true)

      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value || ''
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('CSV export hatası:', error)
      alert('CSV export edilirken hata oluştu!')
    } finally {
      setExportLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'KRITIK': return 'bg-red-100 text-red-800'
      case 'DÜŞÜK': return 'bg-yellow-100 text-yellow-800'
      case 'NORMAL': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'KRITIK': return 'KRİTİK'
      case 'DÜŞÜK': return 'DÜŞÜK'
      case 'NORMAL': return 'NORMAL'
      case 'PENDING': return 'BEKLEMEDE'
      case 'CONFIRMED': return 'ONAYLANDI'
      case 'DELIVERED': return 'TESLİM EDİLDİ'
      case 'CANCELLED': return 'İPTAL EDİLDİ'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Rapor yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <div className="flex gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="stock">Stok Raporu</option>
            <option value="sales">Satış Raporu</option>
            <option value="profit">Kar Marjı Raporu</option>
          </select>
          {reportType === 'sales' && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
            </select>
          )}
          <button
            onClick={() => exportToCSV(
              reportType === 'stock' ? stockReport :
              reportType === 'sales' ? salesReport :
              profitReport,
              `${reportType}-rapor-${new Date().toISOString().split('T')[0]}.csv`
            )}
            disabled={exportLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {exportLoading ? '⏳' : '📊'} CSV Export
          </button>
          <button
            onClick={loadReports}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Stock Report */}
      {reportType === 'stock' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Stok Raporu</h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-blue-600 text-sm">Toplam Malzeme</p>
                <p className="text-2xl font-bold text-blue-900">{stockReport.length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-red-600 text-sm">Kritik Stok</p>
                <p className="text-2xl font-bold text-red-900">
                  {stockReport.filter(item => item.status === 'KRITIK').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-yellow-600 text-sm">Düşük Stok</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stockReport.filter(item => item.status === 'DÜŞÜK').length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-green-600 text-sm">Normal Stok</p>
                <p className="text-2xl font-bold text-green-900">
                  {stockReport.filter(item => item.status === 'NORMAL').length}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Malzeme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mevcut Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min. Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim Fiyat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Değer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-lg font-medium">Stok verisi bulunamadı</p>
                        <p className="text-sm">Yarı mamul veya ham madde ekleyerek başlayın</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stockReport.map((item) => (
                  <tr key={item.material_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.material_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stock_quantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.min_stock_quantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.total_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {reportType === 'sales' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Satış Raporu - {dateRange === 'today' ? 'Bugün' : dateRange === 'week' ? 'Bu Hafta' : 'Bu Ay'}</h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-blue-600 text-sm">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-blue-900">{salesReport.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-green-600 text-sm">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(salesReport.reduce((sum, order) => sum + order.total_amount, 0))}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-purple-600 text-sm">Ortalama Sipariş</p>
                <p className="text-2xl font-bold text-purple-900">
                  {salesReport.length > 0 ?
                    formatCurrency(salesReport.reduce((sum, order) => sum + order.total_amount, 0) / salesReport.length) :
                    formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sipariş No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün Sayısı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p className="text-lg font-medium">Satış verisi bulunamadı</p>
                        <p className="text-sm">Bu dönemde henüz sipariş bulunmuyor</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  salesReport.map((order) => (
                  <tr key={order.order_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.item_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profit Report */}
      {reportType === 'profit' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Kar Marjı Raporu</h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <p className="text-green-600 text-sm">Yüksek Marj (≥30%)</p>
                <p className="text-2xl font-bold text-green-900">
                  {profitReport.filter(item => item.margin_percent >= 30).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-yellow-600 text-sm">Orta Marj (15-29%)</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {profitReport.filter(item => item.margin_percent >= 15 && item.margin_percent < 30).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-red-600 text-sm">Düşük Marj (&lt;15%)</p>
                <p className="text-2xl font-bold text-red-900">
                  {profitReport.filter(item => item.margin_percent < 15).length}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-blue-600 text-sm">Ortalama Marj</p>
                <p className="text-2xl font-bold text-blue-900">
                  {profitReport.length > 0 ?
                    (profitReport.reduce((sum, item) => sum + item.margin_percent, 0) / profitReport.length).toFixed(1) + '%' :
                    '0%'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satış Fiyatı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Malzeme Maliyeti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kar Marjı</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profitReport.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.product_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.material_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item.margin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.margin_percent >= 30 ? 'bg-green-100 text-green-800' :
                        item.margin_percent >= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.margin_percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
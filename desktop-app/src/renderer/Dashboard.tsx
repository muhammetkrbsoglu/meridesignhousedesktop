import React, { useState, useEffect } from 'react'
import supabase from './SupabaseClient'
import type { RawMaterial, Order } from './services/api'

interface DashboardStats {
  totalMaterials: number
  lowStockCount: number
  criticalStockCount: number
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  totalRevenue: number
  monthlyRevenue: number
  recentStockMovements: StockMovement[]
  recentOrders: Order[]
}

interface StockMovement {
  id: string
  raw_material_id: string
  movement_type: string
  quantity: number
  unit: string | null
  reason: string | null
  created_at: string
  raw_materials: {
    name: string
  }
}


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    lowStockCount: 0,
    criticalStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentStockMovements: [],
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStockStats(),
        loadOrderStats(),
        loadRevenueStats(),
        loadRecentActivity()
      ])
    } catch (error) {
      console.error('Dashboard veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStockStats = async () => {
    try {
      const { data: materials } = await supabase
        .from('raw_materials')
        .select('stock_quantity, min_stock_quantity')

      if (materials) {
        const lowStock = materials.filter((m: RawMaterial) =>
          m.stock_quantity !== null &&
          m.min_stock_quantity !== null &&
          m.stock_quantity <= m.min_stock_quantity * 1.2 &&
          m.stock_quantity > m.min_stock_quantity
        ).length

        const criticalStock = materials.filter((m: RawMaterial) =>
          m.stock_quantity !== null &&
          m.min_stock_quantity !== null &&
          m.stock_quantity <= m.min_stock_quantity
        ).length

        setStats(prev => ({
          ...prev,
          totalMaterials: materials.length,
          lowStockCount: lowStock,
          criticalStockCount: criticalStock
        }))
      }
    } catch (error) {
      console.error('Stok istatistikleri yüklenirken hata:', error)
    }
  }

  const loadOrderStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('status')

      if (orders) {
        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: Order) => o.status === 'PENDING').length,
          confirmedOrders: orders.filter((o: Order) => o.status === 'CONFIRMED').length
        }))
      }
    } catch (error) {
      console.error('Sipariş istatistikleri yüklenirken hata:', error)
    }
  }

  const loadRevenueStats = async () => {
    try {
      let dateFilter = {}
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      switch (selectedPeriod) {
        case 'today':
          dateFilter = { createdAt: { gte: today.toISOString() } }
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(today.getDate() - 7)
          dateFilter = { createdAt: { gte: weekAgo.toISOString() } }
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(today.getMonth() - 1)
          dateFilter = { createdAt: { gte: monthAgo.toISOString() } }
          break
        default:
          dateFilter = {}
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('totalAmount, createdAt, status')
        .in('status', ['CONFIRMED', 'DELIVERED'])

      if (orders) {
        const totalRevenue = orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)

        const filteredOrders = orders.filter((order: Order) => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= (dateFilter as any).createdAt?.gte || true
        })

        const monthlyRevenue = filteredOrders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)

        setStats(prev => ({
          ...prev,
          totalRevenue,
          monthlyRevenue
        }))
      }
    } catch (error) {
      console.error('Gelir istatistikleri yüklenirken hata:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Recent stock movements
      const { data: stockMovements } = await supabase
        .from('stock_movements')
        .select(`
          *,
          raw_materials (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5)

      setStats(prev => ({
        ...prev,
        recentStockMovements: stockMovements || [],
        recentOrders: recentOrders || []
      }))
    } catch (error) {
      console.error('Son aktiviteler yüklenirken hata:', error)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Supabase bağlantısı aktif - Gerçek zamanlı güncelleme
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Toplam Malzeme</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalMaterials}</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Düşük Stok</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.lowStockCount}</p>
            </div>
            <div className="text-yellow-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Kritik Stok</p>
              <p className="text-3xl font-bold text-red-900">{stats.criticalStockCount}</p>
            </div>
            <div className="text-red-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Toplam Gelir</p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="text-green-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm10.707 5.293a1 1 0 00-1.414 0L9 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5a1 1 0 000-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Son Siparişler</h2>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500">Henüz sipariş yok</p>
            ) : (
              stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Son Stok Hareketleri</h2>
          <div className="space-y-3">
            {stats.recentStockMovements.length === 0 ? (
              <p className="text-gray-500">Henüz stok hareketi yok</p>
            ) : (
              stats.recentStockMovements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{movement.raw_materials?.name || 'Bilinmeyen Malzeme'}</p>
                    <p className="text-sm text-gray-600">
                      {movement.movement_type === 'OUT' ? 'Çıkış' :
                       movement.movement_type === 'IN' ? 'Giriş' :
                       movement.movement_type === 'RETURN' ? 'İade' : 'Düzeltme'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(movement.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      movement.movement_type === 'OUT' ? 'text-red-600' :
                      movement.movement_type === 'IN' ? 'text-green-600' :
                      movement.movement_type === 'RETURN' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {movement.movement_type === 'OUT' ? '-' : '+'}{movement.quantity} {movement.unit || 'adet'}
                    </p>
                    {movement.reason && (
                      <p className="text-xs text-gray-500">{movement.reason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            📦 Stok Yönetimi
          </button>
          <button className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            📋 Siparişler
          </button>
          <button className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            📊 Raporlar
          </button>
          <button className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            ⚙️ Ayarlar
          </button>
        </div>
      </div>
    </div>
  )
}
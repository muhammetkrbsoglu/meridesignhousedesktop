import React, { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select'
import { Badge } from './ui/Badge'
import { Label } from './ui/Label'
import { 
  SpinnerIcon, 
  RefreshIcon, 
  DownloadIcon, 
  DollarSignIcon, 
  ShoppingCartIcon, 
  BarChartIcon 
} from './icons/index'

// Recharts imports
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ReportData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topCustomers: any[]
  topProducts: any[]
  weeklySales: any[]
  orderStatusData: any[]
  stockStatusData: any[]
  monthlyRevenue: any[]
  monthlySales: any[]
  stockAlerts: any[]
}

// Chart data interfaces
interface WeeklySalesData {
  week: string
  orders: number
  revenue: number
}

interface OrderStatusData {
  name: string
  value: number
  color: string
}

interface StockStatusData {
  name: string
  value: number
  color: string
}

interface MonthlyRevenueData {
  month: string
  revenue: number
  profit: number
}

export const ReportsManager: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topCustomers: [],
    topProducts: [],
    weeklySales: [],
    orderStatusData: [],
    stockStatusData: [],
    monthlyRevenue: [],
    monthlySales: [],
    stockAlerts: []
  })
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState('week') // week, month, year

  useEffect(() => {
    loadReportData()
  }, [reportType, dateRange])

  // Data processing functions
  const processWeeklySalesData = (orders: any[]): WeeklySalesData[] => {
    const weeklyData: { [key: string]: { orders: number, revenue: number } } = {}
    
    orders.forEach(order => {
      const date = new Date(order.createdAt)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { orders: 0, revenue: 0 }
      }
      weeklyData[weekKey].orders += 1
      weeklyData[weekKey].revenue += order.totalAmount || 0
    })

    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8) // Last 8 weeks
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        orders: data.orders,
        revenue: data.revenue
      }))
  }

  const processOrderStatusData = (orders: any[]): OrderStatusData[] => {
    const statusCounts: { [key: string]: number } = {}
    
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    const colors = {
      'PENDING': '#F59E0B',
      'CONFIRMED': '#10B981', 
      'SHIPPED': '#3B82F6',
      'DELIVERED': '#8B5CF6',
      'CANCELLED': '#EF4444'
    }

    const statusTranslations = {
      'PENDING': 'Beklemede',
      'CONFIRMED': 'Onaylandı',
      'SHIPPED': 'Kargoya Verildi',
      'DELIVERED': 'Teslim Edildi',
      'CANCELLED': 'İptal Edildi'
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusTranslations[status as keyof typeof statusTranslations] || status,
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280'
    }))
  }

  const processStockStatusData = (materials: any[]): StockStatusData[] => {
    let normal = 0
    let low = 0
    let critical = 0

    materials.forEach(material => {
      if (material.stock_quantity === null || material.min_stock_quantity === null) {
        normal++
        return
      }

      if (material.stock_quantity <= material.min_stock_quantity) {
        critical++
      } else if (material.stock_quantity <= material.min_stock_quantity * 1.2) {
        low++
      } else {
        normal++
      }
    })

    return [
      { name: 'Normal', value: normal, color: '#10B981' },
      { name: 'Düşük', value: low, color: '#F59E0B' },
      { name: 'Kritik', value: critical, color: '#EF4444' }
    ]
  }

  const processMonthlyRevenueData = (orders: any[]): MonthlyRevenueData[] => {
    const monthlyData: { [key: string]: { revenue: number, profit: number } } = {}
    
    orders.forEach(order => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, profit: 0 }
      }
      monthlyData[monthKey].revenue += order.totalAmount || 0
      monthlyData[monthKey].profit += (order.totalAmount || 0) * 0.3 // Assuming 30% profit margin
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('tr-TR', { month: 'short' }),
        revenue: data.revenue,
        profit: data.profit
      }))
  }

  const loadReportData = async () => {
    try {
      setLoading(true)

      // Load basic data using Supabase directly
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false })

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false })

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'CUSTOMER')

      const { data: rawMaterials, error: materialsError } = await supabase
        .from('raw_materials')
        .select('stock_quantity, min_stock_quantity, name')

      if (ordersError) throw ordersError
      if (productsError) throw productsError
      if (usersError) throw usersError
      if (materialsError) throw materialsError

      // Calculate totals
      const totalSales = (orders || []).reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
      const totalOrders = (orders || []).length
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

      // Process weekly sales data
      const weeklySales = processWeeklySalesData(orders || [])
      
      // Process order status data
      const orderStatusData = processOrderStatusData(orders || [])
      
      // Process stock status data
      const stockStatusData = processStockStatusData(rawMaterials || [])
      
      // Process monthly revenue data
      const monthlyRevenue = processMonthlyRevenueData(orders || [])

      // Top customers by order count
      const customerOrderCounts = (users || []).map((user: any) => ({
        ...user,
        orderCount: (orders || []).filter((order: any) => order.userId === user.id).length
      })).filter((user: any) => user.orderCount > 0)

      const topCustomers = customerOrderCounts
        .sort((a: any, b: any) => b.orderCount - a.orderCount)
        .slice(0, 5)

      // Top products by stock
      const topProducts = (products || [])
        .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 5)

      // Mock data for monthly sales and stock alerts (for backward compatibility)
      const monthlySales = [
        { month: 'Ocak', sales: 15000, orders: 45 },
        { month: 'Şubat', sales: 22000, orders: 62 },
        { month: 'Mart', sales: 18000, orders: 51 },
        { month: 'Nisan', sales: 25000, orders: 78 },
        { month: 'Mayıs', sales: 30000, orders: 95 },
        { month: 'Haziran', sales: 28000, orders: 88 }
      ]

      const stockAlerts = (products || []).filter((product: any) => (product.stock || 0) < 10)

      setReportData({
        totalSales,
        totalOrders,
        averageOrderValue,
        topCustomers,
        topProducts,
        weeklySales,
        orderStatusData,
        stockStatusData,
        monthlyRevenue,
        monthlySales,
        stockAlerts
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type: string) => {
    const data = {
      summary: {
        totalSales: reportData.totalSales,
        totalOrders: reportData.totalOrders,
        averageOrderValue: reportData.averageOrderValue,
        generatedAt: new Date().toISOString()
      },
      topCustomers: reportData.topCustomers,
      topProducts: reportData.topProducts,
      weeklySales: reportData.weeklySales,
      orderStatus: reportData.orderStatusData,
      stockStatus: reportData.stockStatusData,
      monthlyRevenue: reportData.monthlyRevenue
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <div className="flex gap-2">
          <Button onClick={loadReportData} disabled={loading} variant="outline">
            {loading ? <SpinnerIcon className="animate-spin" /> : <RefreshIcon />}
            Yenile
          </Button>
          <Button onClick={() => exportReport('full')}>
            <DownloadIcon className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reportType">Rapor Türü</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Özet Rapor</SelectItem>
              <SelectItem value="sales">Satış Raporu</SelectItem>
              <SelectItem value="stock">Stok Raporu</SelectItem>
              <SelectItem value="customers">Müşteri Raporu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateRange">Tarih Aralığı</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Haftalık</SelectItem>
              <SelectItem value="month">Aylık</SelectItem>
              <SelectItem value="quarter">Çeyrek</SelectItem>
              <SelectItem value="year">Yıllık</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Report */}
      {reportType === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{reportData.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Toplam gelir</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Verilen sipariş sayısı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Sipariş</CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{reportData.averageOrderValue.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Ortalama sipariş tutarı</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers and Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>En İyi Müşteriler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{customer.orderCount}</p>
                        <p className="text-xs text-gray-500">sipariş</p>
                      </div>
                    </div>
                  ))}
                  {reportData.topCustomers.length === 0 && (
                    <p className="text-sm text-gray-500">Henüz müşteri verisi yok</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stok Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Düşük Stok Ürünleri</span>
                    <span className="text-sm font-medium text-red-600">{reportData.stockAlerts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Toplam Ürün</span>
                    <span className="text-sm font-medium">{reportData.topProducts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aktif Ürün</span>
                    <span className="text-sm font-medium text-green-600">
                      {reportData.topProducts.filter(p => p.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Sales Trend - Multi-line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Haftalık Satış Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.weeklySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis 
                        yAxisId="orders"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis 
                        yAxisId="revenue"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        tickFormatter={(value) => `₺${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          name === 'orders' ? value : `₺${value.toLocaleString()}`,
                          name === 'orders' ? 'Sipariş Sayısı' : 'Gelir'
                        ]}
                      />
                      <Legend />
                      <Line 
                        yAxisId="orders"
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                      <Line 
                        yAxisId="revenue"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Status Distribution - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Durumu Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`${value} sipariş`, 'Adet']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Status - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stok Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.stockStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#666" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`${value} ürün`, 'Adet']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {reportData.stockStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue - Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.monthlyRevenue}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#666" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#666" tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          `₺${value.toLocaleString()}`,
                          name === 'revenue' ? 'Gelir' : 'Kar'
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stackId="2"
                        stroke="#EC4899"
                        strokeWidth={3}
                        fill="url(#profitGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {reportType === 'sales' && (
        <Card>
          <CardHeader>
            <CardTitle>Aylık Satış Raporu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlySales.map((month: any, index: number) => (
                <div key={`month-${index}-${month.month}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-gray-500">{month.orders} sipariş</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₺{month.sales.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">satış</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Report */}
      {reportType === 'stock' && (
        <Card>
          <CardHeader>
            <CardTitle>Stok Uyarıları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.stockAlerts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {product.stock} adet
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      ₺{product.price} fiyat
                    </p>
                  </div>
                </div>
              ))}
              {reportData.stockAlerts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Düşük stoklu ürün bulunamadı. Tüm ürünler yeterli seviyede.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Report */}
      {reportType === 'customers' && (
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{customer.orderCount} sipariş</p>
                    <p className="text-sm text-gray-500">toplam sipariş</p>
                  </div>
                </div>
              ))}
              {reportData.topCustomers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Henüz müşteri verisi yok
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { 
  SpinnerIcon, 
  RefreshIcon, 
  UsersIcon, 
  PackageIcon, 
  ShoppingCartIcon, 
  AlertTriangleIcon 
} from './icons/index'

interface DashboardStats {
  totalCustomers: number
  totalProducts: number
  totalOrders: number
  lowStockProducts: number
  recentOrders: any[]
  topProducts: any[]
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    lowStockProducts: 0,
    recentOrders: [],
    topProducts: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load products count
      const { data: products } = await supabase.from('products').select('*')

      // Load raw materials count
      const { data: rawMaterials } = await supabase.from('raw_materials').select('*')

      // Load low stock products - get all raw materials and filter in JS
      const lowStockProducts = rawMaterials?.filter((item: any) => item.stock_quantity < 10) || []

      // Load recent products (last 5)
      const { data: recentOrders } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5)

      // Load top products (by stock)
      const { data: topProducts } = await supabase
        .from('products')
        .select('*')
        .order('stock', { ascending: false })
        .limit(5)

      setStats({
        totalCustomers: products?.length || 0,
        totalProducts: products?.length || 0,
        totalOrders: rawMaterials?.length || 0,
        lowStockProducts: lowStockProducts.length,
        recentOrders: recentOrders || [],
        topProducts: topProducts || []
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (stock: number) => {
    if (stock <= 0) return 'bg-red-500'
    if (stock < 10) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (stock: number) => {
    if (stock <= 0) return 'Stok Yok'
    if (stock < 10) return 'Düşük Stok'
    return 'Stok Var'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? <SpinnerIcon className="animate-spin" /> : <RefreshIcon />}
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Aktif müşteri sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Katalogdaki ürün sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Verilen sipariş sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">10'dan az stoklu ürün</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customerName}</p>
                  </div>
                  <Badge variant={order.status === 'PENDING' ? 'secondary' : 'default'}>
                    {order.status}
                  </Badge>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <p className="text-sm text-gray-500">Henüz sipariş yok</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En Çok Stoklu Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(product.stock)}>
                      {product.stock} adet
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {getStatusText(product.stock)}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-sm text-gray-500">Henüz ürün yok</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

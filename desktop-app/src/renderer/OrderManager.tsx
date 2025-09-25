import React, { useState, useEffect } from 'react'
import supabase from './SupabaseClient'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
}

interface Product {
  id: string
  name: string
  sku: string | null
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    loadData()

    // Realtime subscriptions for orders
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Orders changed:', payload)
          loadOrders()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload: any) => {
          console.log('Order items changed:', payload)
          loadOrders()
        }
      )
      .subscribe()

    // Load products for lookup
    loadProducts()

    return () => {
      ordersSubscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadOrders(), loadProducts()])
  }

  const loadOrders = async () => {
    try {
      setLoading(true)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('createdAt', { ascending: false })

      if (ordersError) {
        console.error('Orders load error:', ordersError)
        setOrders([])
      } else {
        setOrders(ordersData || [])
      }
    } catch (error) {
      console.error('Sipariş yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('name')

      if (productsError) {
        console.error('Products load error:', productsError)
      } else {
        setProducts(productsData || [])
      }
    } catch (error) {
      console.error('Ürün yüklenirken hata:', error)
    }
  }

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product ? product.name : `Ürün #${productId.slice(0, 8)}`
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Order status update error:', error)
        alert('Sipariş durumu güncellenirken hata oluştu!')
      } else {
        console.log(`Order ${orderId} status updated to ${newStatus}`)
        loadOrders() // Reload to reflect changes
      }
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error)
      alert('Sipariş durumu güncellenirken hata oluştu!')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'all') return true
    return order.status === selectedStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'BEKLEMEDE'
      case 'CONFIRMED': return 'ONAYLANDI'
      case 'PROCESSING': return 'HAZIRLANIYOR'
      case 'SHIPPED': return 'GÖNDERİLDİ'
      case 'DELIVERED': return 'TESLİM EDİLDİ'
      case 'CANCELLED': return 'İPTAL EDİLDİ'
      case 'REFUNDED': return 'İADE EDİLDİ'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
        <div className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="PENDING">Beklemede</option>
            <option value="CONFIRMED">Onaylandı</option>
            <option value="PROCESSING">Hazırlanıyor</option>
            <option value="SHIPPED">Gönderildi</option>
            <option value="DELIVERED">Teslim Edildi</option>
            <option value="CANCELLED">İptal Edildi</option>
            <option value="REFUNDED">İade Edildi</option>
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Supabase bağlantısı aktif - Gerçek zamanlı sipariş senkronizasyonu
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Sipariş bulunamadı</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md border">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">#{order.orderNumber}</h3>
                    <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-lg font-bold mt-1">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-semibold mb-2">Müşteri Bilgileri</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Ad:</strong> {order.customerName}</p>
                      <p><strong>Email:</strong> {order.customerEmail}</p>
                      <p><strong>Telefon:</strong> {order.customerPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Teslimat Adresi</h4>
                    <div className="space-y-1 text-sm">
                      <p>{order.shippingAddress}</p>
                      <p>{order.shippingCity}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Ürünler</h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{getProductName(item.productId)}</span>
                          <span className="text-gray-600 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      ✅ Onayla (Stok Düş)
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ❌ İptal Et
                    </button>
                  </div>
                )}

                {order.status === 'CONFIRMED' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      📦 Hazırlamaya Başla
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ❌ İptal Et (Stok İade)
                    </button>
                  </div>
                )}

                {(order.status === 'PROCESSING' || order.status === 'SHIPPED') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      ✅ Teslim Edildi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Toplam Sipariş</h4>
          <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Beklemede</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'PENDING').length}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Onaylanan</h4>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'CONFIRMED').length}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800">Tamamlanan</h4>
          <p className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'DELIVERED').length}
          </p>
        </div>
      </div>
    </div>
  )
}
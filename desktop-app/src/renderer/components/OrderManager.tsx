import React, { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Button } from './ui/Button'
import { OrderCard } from './OrderCard'
import { OrderTable } from './OrderTable'
import { OrderFilters } from './OrderFilters'
import { 
  SpinnerIcon, 
  RefreshIcon, 
  ShoppingCartIcon,
  PackageIcon,
  LayoutGridIcon,
  TableIcon,
  SettingsIcon,
  TrendingUpIcon
} from './icons/index'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  subtotal?: number
  tax?: number
  shippingCost?: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  shippingCity?: string
  shippingCountry?: string
  payment_method?: string
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  admin_notes?: string
  createdAt: string
  updatedAt: string
  
  // Desktop alanları
  deadline_date?: string
  payment_received_date?: string
  shipping_method?: string
  order_source?: string
  amount_received?: number
  discount_amount?: number
  remaining_payment?: number
  profit_margin_percent?: number
  labor_cost?: number
  net_profit?: number
  profit_margin_percent_2?: number
  total_cost?: number
  
  // İlişkili veriler
  items?: OrderItem[]
  user?: {
    name: string
    email: string
  }
}

interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  personalization?: any
  product?: {
    id: string
    name: string
    slug: string
    price: number
    product_images?: { id: string; url: string }[] | null
  }
}

export const OrderManager: React.FC = () => {
  // State Management
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  // Effects
  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, filterStatus])

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isStatusDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.status-dropdown')) {
          setIsStatusDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStatusDropdownOpen])

  // Data Loading
  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            product:products (
              id,
              name,
              slug,
              price,
              product_images(id, url)
            )
          ),
          user:users (
            name,
            email
          )
        `)
        .order('createdAt', { ascending: false })
      
      if (ordersError) {
        console.error('Error loading orders:', ordersError)
        return
      }

      const transformedOrders: Order[] = (ordersData || []).map((order: any) => ({
        ...order,
        orderNumber: order.orderNumber || order.order_number || '',
        totalAmount: order.totalAmount || order.total_amount || 0,
        shippingCost: order.shippingCost || order.shipping_cost || 0,
        customerName: order.customerName || order.customer_name || '',
        customerEmail: order.customerEmail || order.customer_email || '',
        customerPhone: order.customerPhone || order.customer_phone,
        shippingAddress: order.shippingAddress || order.shipping_address,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        trackingNumber: order.trackingNumber || order.tracking_number,
        admin_notes: order.admin_notes
      }))

      setOrders(transformedOrders)

      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products (
            id,
            name,
            slug,
            price,
            product_images(id, url)
          )
        `)
      
      if (itemsError) {
        console.error('Error loading order items:', itemsError)
      } else {
        setOrderItems(orderItemsData || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtering
  const filterOrders = () => {
    let filtered = [...orders]

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    setFilteredOrders(filtered)
  }

  // Order Operations
  const updateOrderStatus = async (orderId: string, newStatus: string, previousStatus?: string) => {
    try {
      console.log('🔄 Updating order status:', {
        orderId,
        newStatus,
        timestamp: new Date().toISOString()
      })

      // Validate input
      if (!orderId || !newStatus) {
        throw new Error('Order ID and new status are required')
      }

      // Check if status is valid
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}`)
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('❌ Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          orderId,
          newStatus
        })
        throw error
      }

      console.log('✅ Order status updated successfully:', {
        orderId,
        newStatus,
        affectedRows: data?.length || 0,
        data
      })

      // Store previous status for undo functionality
      if (previousStatus) {
        // Store in localStorage for undo functionality
        const undoKey = `undo_${orderId}_${Date.now()}`
        localStorage.setItem(undoKey, JSON.stringify({
          orderId,
          previousStatus,
          newStatus,
          timestamp: new Date().toISOString()
        }))
        
        // Clean up old undo entries (keep only last 10)
        const undoKeys = Object.keys(localStorage).filter(key => key.startsWith(`undo_${orderId}_`))
        if (undoKeys.length > 10) {
          undoKeys.sort().slice(0, -10).forEach(key => localStorage.removeItem(key))
        }
      }

      await loadOrders()
    } catch (error) {
      console.error('💥 Error updating order status:', {
        error,
        orderId,
        newStatus,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      // Show user-friendly error message
      alert(`Sipariş durumu güncellenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  // Undo functionality
  const undoLastStatusChange = async (orderId: string) => {
    try {
      // Find the most recent undo entry for this order
      const undoKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(`undo_${orderId}_`))
        .sort()
        .reverse()
      
      if (undoKeys.length === 0) {
        alert('Geri alınacak işlem bulunamadı')
        return
      }

      const latestUndoKey = undoKeys[0]
      const undoData = JSON.parse(localStorage.getItem(latestUndoKey) || '{}')
      
      if (!undoData.previousStatus) {
        alert('Geri alınacak işlem bulunamadı')
        return
      }

      console.log('🔄 Undoing status change:', undoData)

      // Update back to previous status
      await updateOrderStatus(orderId, undoData.previousStatus)
      
      // Remove the undo entry
      localStorage.removeItem(latestUndoKey)
      
      alert(`Sipariş durumu "${getStatusText(undoData.previousStatus)}" olarak geri alındı`)
    } catch (error) {
      console.error('Error undoing status change:', error)
      alert('Geri alma işlemi başarısız oldu')
    }
  }

  const updateOrderField = async (orderId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          [field]: value,
          updatedAt: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order field:', error)
        throw error
      }

      await loadOrders()
    } catch (error) {
      console.error('Error updating order field:', error)
    }
  }

  // Utility Functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'READY_TO_SHIP': return 'bg-indigo-100 text-indigo-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Onay Sürecinde'
      case 'CONFIRMED': return 'Onaylandı'
      case 'PROCESSING': return 'İşleniyor'
      case 'READY_TO_SHIP': return 'Kargoya Hazır'
      case 'SHIPPED': return 'Kargoda'
      case 'DELIVERED': return 'Teslim Edildi'
      case 'CANCELLED': return 'İptal Edildi'
      case 'REFUNDED': return 'İade Edildi'
      default: return status
    }
  }

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.orderId === orderId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      'PENDING': 'CONFIRMED',
      'CONFIRMED': 'PROCESSING',
      'PROCESSING': 'READY_TO_SHIP',
      'READY_TO_SHIP': 'SHIPPED',
      'SHIPPED': 'DELIVERED'
    }
    return statusFlow[currentStatus] || null
  }

  const openWhatsApp = (phone: string, orderNumber: string, customerName: string) => {
    const message = `Merhaba ${customerName},\n\nSipariş No: ${orderNumber}\n\nSiparişiniz hakkında bilgi vermek istiyorum.`
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }


  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'all': return 'Tüm durumlar'
      case 'PENDING': return 'Onay Sürecinde'
      case 'CONFIRMED': return 'Onaylandı'
      case 'PROCESSING': return 'İşleniyor'
      case 'READY_TO_SHIP': return 'Kargoya Hazır'
      case 'SHIPPED': return 'Kargoda'
      case 'DELIVERED': return 'Teslim Edildi'
      case 'CANCELLED': return 'İptal Edildi'
      case 'REFUNDED': return 'İade Edildi'
      default: return 'Tüm durumlar'
    }
  }

  // Event Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusChange = (status: string) => {
    setFilterStatus(status)
    setIsStatusDropdownOpen(false)
  }

  const handleDropdownToggle = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen)
  }

  // Statistics
  const getOrderStats = () => {
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const pendingCount = filteredOrders.filter(o => o.status === 'PENDING').length
    const deliveredCount = filteredOrders.filter(o => o.status === 'DELIVERED').length
    const totalProfit = filteredOrders.reduce((sum, order) => sum + (order.net_profit || 0), 0)
    
    return { totalAmount, pendingCount, deliveredCount, totalProfit }
  }

  const stats = getOrderStats()

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px] opacity-30 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title & Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
                <ShoppingCartIcon className="h-8 w-8 text-white" />
              </div>
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Sipariş Yönetimi
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  {filteredOrders.length} sipariş gösteriliyor • {orders.length} toplam sipariş
                </p>
              </div>
            </div>

            {/* Right: View Toggle & Actions */}
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1 shadow-inner">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'secondary'}
              onClick={() => setViewMode('cards')}
                  className={`rounded-xl transition-all duration-300 ${
                    viewMode === 'cards'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600'
                  }`}
            >
                  <LayoutGridIcon className="h-4 w-4 mr-2" />
              Kartlar
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'secondary'}
              onClick={() => setViewMode('table')}
                  className={`rounded-xl transition-all duration-300 ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600'
                  }`}
            >
                  <TableIcon className="h-4 w-4 mr-2" />
              Tablo
            </Button>
          </div>

              {/* Refresh Button */}
              <Button
                onClick={loadOrders}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transition-all duration-300 px-6 py-3"
              >
                {loading ? (
                  <SpinnerIcon className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <RefreshIcon className="h-5 w-5 mr-2" />
                )}
            Yenile
          </Button>
        </div>
      </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-blue-800">₺{stats.totalAmount.toFixed(2)}</p>
              </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
              <div className="flex items-center justify-between">
                          <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">Bekleyen Sipariş</p>
                  <p className="text-2xl font-bold text-amber-800">{stats.pendingCount}</p>
                          </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <PackageIcon className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                  </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
              <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Teslim Edilen</p>
                  <p className="text-2xl font-bold text-green-800">{stats.deliveredCount}</p>
                    </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200/50">
                                    <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Toplam Kar</p>
                  <p className="text-2xl font-bold text-purple-800">₺{stats.totalProfit.toFixed(2)}</p>
                                    </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-purple-600" />
                                    </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

        {/* Filters */}
        <OrderFilters
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          isStatusDropdownOpen={isStatusDropdownOpen}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onDropdownToggle={handleDropdownToggle}
          getStatusDisplayText={getStatusDisplayText}
        />

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
                      <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SpinnerIcon className="animate-spin h-8 w-8 text-white" />
                      </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Siparişler Yükleniyor</h3>
              <p className="text-gray-600">Lütfen bekleyin...</p>
                      </div>
                        </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => {
                  const orderItemsData = getOrderItems(order.id)

                  return (
                <OrderCard
                  key={order.id}
                  order={order}
                  orderItems={orderItemsData}
                  isExpanded={false}
                  onToggleExpansion={() => {}}
                  onStatusUpdate={updateOrderStatus}
                  onFieldUpdate={updateOrderField}
                  onWhatsAppOpen={openWhatsApp}
                  onUndoStatusChange={undoLastStatusChange}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getNextStatus={getNextStatus}
                />
              )
            })}
                                    </div>
                                  ) : (
          <OrderTable
            orders={filteredOrders}
            orderItems={orderItems}
            onStatusUpdate={updateOrderStatus}
            onFieldUpdate={updateOrderField}
            onWhatsAppOpen={openWhatsApp}
            onUndoStatusChange={undoLastStatusChange}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getNextStatus={getNextStatus}
          />
        )}

        {/* Empty State */}
      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl"></div>
                <div className="relative p-12 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-500" />
                </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Sipariş Bulunamadı
                </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  Arama kriterlerinize uygun sipariş bulunamadı.
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    Farklı filtreler deneyin veya yeni siparişler için bekleyin.
                  </span>
                </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => {
                        setSearchTerm('')
                        setFilterStatus('all')
                      }}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg transition-all duration-300"
                    >
                      Filtreleri Temizle
                    </Button>
                  <Button
                    onClick={loadOrders}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transition-all duration-300"
                  >
                    <RefreshIcon className="h-4 w-4 mr-2" />
                    Yenile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
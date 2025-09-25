import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  EyeIcon, 
  ArrowRightIcon, 
  MessageSquareIcon,
  PackageIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  TrendingUpIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from './icons/index'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  shippingCity?: string
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  admin_notes?: string
  createdAt: string
  
  // Desktop alanları
  deadline_date?: string
  order_source?: string
  amount_received?: number
  discount_amount?: number
  remaining_payment?: number
  labor_cost?: number
  net_profit?: number
  profit_margin_percent?: number
  total_cost?: number
  
  // İlişkili veriler
  items?: OrderItem[]
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

interface OrderTableProps {
  orders: Order[]
  orderItems: OrderItem[]
  onStatusUpdate: (orderId: string, newStatus: string, previousStatus?: string) => void
  onFieldUpdate: (orderId: string, field: string, value: any) => void
  onWhatsAppOpen: (phone: string, orderNumber: string, customerName: string) => void
  onUndoStatusChange: (orderId: string) => void
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  getNextStatus: (currentStatus: string) => string | null
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  orderItems,
  onStatusUpdate,
  onFieldUpdate,
  onWhatsAppOpen,
  onUndoStatusChange,
  formatDate,
  getStatusColor,
  getStatusText,
  getNextStatus
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.orderId === orderId)
  }

  const toggleRowExpansion = (orderId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', accent: 'text-amber-600', icon: '⏳' }
      case 'CONFIRMED':
        return { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', accent: 'text-blue-600', icon: '✅' }
      case 'PROCESSING':
        return { bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-200', accent: 'text-indigo-600', icon: '⚙️' }
      case 'READY_TO_SHIP':
        return { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'text-emerald-600', icon: '📦' }
      case 'SHIPPED':
        return { bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', accent: 'text-violet-600', icon: '🚚' }
      case 'DELIVERED':
        return { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', accent: 'text-green-600', icon: '🎉' }
      case 'CANCELLED':
        return { bg: 'from-red-50 to-rose-50', border: 'border-red-200', accent: 'text-red-600', icon: '❌' }
      default:
        return { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', accent: 'text-gray-600', icon: '📋' }
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Table Header - Compact */}
      <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="grid grid-cols-12 gap-3 p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <div className="col-span-3 flex items-center space-x-2">
            <PackageIcon className="w-3 h-3" />
            <span>Sipariş</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <UserIcon className="w-3 h-3" />
            <span>Müşteri</span>
          </div>
          <div className="col-span-1 flex items-center space-x-2">
            <span>Durum</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <CurrencyDollarIcon className="w-3 h-3" />
            <span>Finansal</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <CalendarIcon className="w-3 h-3" />
            <span>Tarih & Termin</span>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span>İşlemler</span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200/30">
        {orders.map((order) => {
          const orderItemsData = getOrderItems(order.id)
          const nextStatus = getNextStatus(order.status)
          const isExpanded = expandedRows.has(order.id)
          const statusConfig = getStatusConfig(order.status)

          return (
            <div key={order.id} className="group">
              {/* Main Row - Compact */}
              <div 
                className={`
                  grid grid-cols-12 gap-3 p-4
                  bg-gradient-to-r ${statusConfig.bg}
                  transition-all duration-300
                  cursor-pointer border-l-4 ${statusConfig.border}
                `}
                onClick={() => toggleRowExpansion(order.id)}
              >
                {/* Order Info - Compact */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm ${statusConfig.accent}`}>
                      <span className="text-xs">{statusConfig.icon}</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{order.orderNumber}</div>
                      <div className="text-xs text-gray-600 flex items-center space-x-1">
                        <PackageIcon className="w-2 h-2" />
                        <span>{orderItemsData.length} ürün</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info - Compact */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{order.customerName}</div>
                    <div className="text-xs text-gray-600 truncate">{order.customerEmail}</div>
                    {order.customerPhone && (
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    )}
                  </div>
                </div>

                {/* Status - Compact */}
                <div className="col-span-1">
                  <Badge className={`${getStatusColor(order.status)} text-xs font-medium px-1.5 py-0.5`}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>

                {/* Financial - Compact */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 text-sm">
                      ₺{order.totalAmount.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {order.payment_status === 'PAID' ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">Ödendi</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-amber-600 font-medium">Beklemede</span>
                        </>
                      )}
                    </div>
                    {order.remaining_payment && order.remaining_payment > 0 && (
                      <div className="text-xs text-red-600 font-medium">
                        Kalan: ₺{order.remaining_payment.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Deadline - Compact */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                    {order.deadline_date && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <ClockIcon className="w-2 h-2" />
                        <span className="text-xs font-medium">{formatDate(order.deadline_date)}</span>
                      </div>
                    )}
                    {order.order_source && (
                      <div className="flex items-center space-x-1 text-purple-600">
                        <MapPinIcon className="w-2 h-2" />
                        <span className="text-xs font-medium">{order.order_source}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - Compact */}
                <div className="col-span-2 flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {/* WhatsApp */}
                  {order.customerPhone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWhatsAppOpen(order.customerPhone!, order.orderNumber, order.customerName)}
                      className="h-6 w-6 p-0 bg-green-500 text-white border-0 shadow-sm transition-all duration-200"
                    >
                      <MessageSquareIcon className="w-2 h-2" />
                    </Button>
                  )}

                  {/* Detail Button - Placeholder for now */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 bg-blue-500 text-white border-0 shadow-sm transition-all duration-200"
                    title="Detaylar için kart görünümünü kullanın"
                  >
                    <EyeIcon className="w-2 h-2" />
                  </Button>

                  {/* Undo Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUndoStatusChange(order.id)}
                    className="h-6 w-6 p-0 bg-orange-500 text-white border-0 shadow-sm transition-all duration-200"
                    title="Son işlemi geri al"
                  >
                    <ArrowRightIcon className="w-2 h-2 rotate-180" />
                  </Button>

                  {/* Status Update */}
                  {nextStatus && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusUpdate(order.id, nextStatus, order.status)}
                      className="h-6 w-6 p-0 bg-purple-500 text-white border-0 shadow-sm transition-all duration-200"
                    >
                      <ArrowRightIcon className="w-2 h-2" />
                    </Button>
                  )}

                  {/* Expand Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 bg-gray-500 text-white border-0 shadow-sm transition-all duration-200"
                  >
                    {isExpanded ? <ChevronDownIcon className="w-2 h-2" /> : <ChevronRightIcon className="w-2 h-2" />}
                  </Button>
                </div>
              </div>

              {/* Expanded Row Content - Compact */}
              {isExpanded && (
                <div className="bg-white/60 backdrop-blur-sm border-t border-gray-200/50">
                  <div className="p-4 space-y-4">
                    {/* Compact Financial Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.amount_received && (
                        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <CurrencyDollarIcon className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Alınan</span>
                          </div>
                          <div className="text-sm font-bold text-green-800">
                            ₺{(order.amount_received || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {order.discount_amount && (
                        <div className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <TrendingUpIcon className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-700">İskonto</span>
                          </div>
                          <div className="text-sm font-bold text-red-800">
                            ₺{(order.discount_amount || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {order.labor_cost && (
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <PackageIcon className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">İşçilik</span>
                          </div>
                          <div className="text-sm font-bold text-blue-800">
                            ₺{(order.labor_cost || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {order.remaining_payment && (order.remaining_payment || 0) > 0 && (
                        <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <ClockIcon className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">Kalan</span>
                          </div>
                          <div className="text-sm font-bold text-orange-800">
                            ₺{(order.remaining_payment || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compact Profit Analysis */}
                    {(order.net_profit || order.profit_margin_percent) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.net_profit && (
                          <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200/50">
                            <div className="flex items-center space-x-2 mb-1">
                              <TrendingUpIcon className="w-3 h-3 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">Net Kar</span>
                            </div>
                            <div className="text-lg font-bold text-emerald-800">
                              ₺{(order.net_profit || 0).toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        {order.profit_margin_percent && (
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200/50">
                            <div className="flex items-center space-x-2 mb-1">
                              <TrendingUpIcon className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700">Kar Marjı</span>
                            </div>
                            <div className="text-lg font-bold text-purple-800">
                              %{(order.profit_margin_percent || 0).toFixed(1)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compact Additional Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPinIcon className="w-3 h-3 text-gray-600" />
                            <span className="text-xs font-medium text-gray-700">Teslimat Adresi</span>
                          </div>
                          <div className="text-xs text-gray-800 leading-relaxed">
                            {order.shippingAddress}
                            {order.shippingCity && (
                              <div className="text-gray-500 mt-1">{order.shippingCity}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {order.admin_notes && (
                        <div className="p-3 bg-amber-50/80 backdrop-blur-sm rounded-lg border border-amber-200/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-medium text-amber-700">Admin Notları</span>
                          </div>
                          <div className="text-xs text-amber-800 leading-relaxed">
                            {order.admin_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State - Compact */}
      {orders.length === 0 && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200/50 shadow-lg">
              <div className="p-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <PackageIcon className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Sipariş Bulunamadı
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Henüz hiç sipariş bulunmuyor.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Yeni siparişler geldiğinde burada görünecek.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
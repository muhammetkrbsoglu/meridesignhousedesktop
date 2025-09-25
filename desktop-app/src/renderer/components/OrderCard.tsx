import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Label } from './ui/Label'
import { Textarea } from './ui/Textarea'
import { Input } from './ui/Input'
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
  PhoneIcon,
  MailIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
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
  shippingCountry?: string
  payment_method?: string
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  trackingNumber?: string
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

interface OrderCardProps {
  order: Order
  orderItems: OrderItem[]
  isExpanded: boolean
  onToggleExpansion: () => void
  onStatusUpdate: (orderId: string, newStatus: string, previousStatus?: string) => void
  onFieldUpdate: (orderId: string, field: string, value: any) => void
  onWhatsAppOpen: (phone: string, orderNumber: string, customerName: string) => void
  onUndoStatusChange: (orderId: string) => void
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  getNextStatus: (currentStatus: string) => string | null
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  orderItems,
  isExpanded,
  onToggleExpansion,
  onStatusUpdate,
  onFieldUpdate,
  onWhatsAppOpen,
  onUndoStatusChange,
  formatDate,
  getStatusColor,
  getStatusText,
  getNextStatus
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const nextStatus = getNextStatus(order.status)
  
  // Status-based styling
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

  const statusConfig = getStatusConfig(order.status)

  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded)
  }

  // Tüm olası durum adımları
  const getAllPossibleStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: 'PENDING', label: 'Onay Sürecinde', icon: '⏳' },
      { value: 'CONFIRMED', label: 'Onaylandı', icon: '✅' },
      { value: 'PROCESSING', label: 'İşleniyor', icon: '⚙️' },
      { value: 'READY_TO_SHIP', label: 'Kargoya Hazır', icon: '📦' },
      { value: 'SHIPPED', label: 'Kargoda', icon: '🚚' },
      { value: 'DELIVERED', label: 'Teslim Edildi', icon: '🎉' },
      { value: 'CANCELLED', label: 'İptal Edildi', icon: '❌' }
    ]
    
    // Mevcut durumdan sonraki tüm durumları döndür
    const currentIndex = allStatuses.findIndex(s => s.value === currentStatus)
    const result = currentIndex >= 0 ? allStatuses.slice(currentIndex + 1) : []
    
    console.log('Current status:', currentStatus)
    console.log('Current index:', currentIndex)
    console.log('Possible next statuses:', result)
    
    return result
  }

  const possibleNextStatuses = getAllPossibleStatuses(order.status)

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

  return (
    <div 
      className={`
        group relative overflow-hidden
        bg-gradient-to-br ${statusConfig.bg}
        backdrop-blur-sm border ${statusConfig.border}
        rounded-2xl shadow-xl
        transition-all duration-300 ease-out
        cursor-pointer
      `}
    >
      {/* Status Indicator Line */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${statusConfig.bg} ${statusConfig.border}`} />
      
      {/* Main Content */}
      <div className="relative p-6">
        {/* Header Row - Compact */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Order Info */}
          <div className="flex items-center space-x-4">
            {/* Status Icon */}
            <div className={`
              flex items-center justify-center w-10 h-10
              rounded-xl bg-white/80 backdrop-blur-sm
              shadow-lg border border-white/50
              ${statusConfig.accent}
            `}>
              <span className="text-lg">{statusConfig.icon}</span>
            </div>
            
            {/* Order Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {order.orderNumber}
                </h3>
                <Badge className={`${getStatusColor(order.status)} text-sm font-medium px-3 py-1`}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
              
              {/* Customer & Date Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center space-x-1">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.deadline_date && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatDate(order.deadline_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Amount & Actions */}
          <div className="flex items-center space-x-4">
            {/* Amount */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ₺{order.totalAmount.toFixed(2)}
              </div>
              {order.payment_status === 'PAID' ? (
                <div className="text-sm text-green-600 font-medium flex items-center justify-end space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ödendi</span>
                </div>
              ) : (
                <div className="text-sm text-amber-600 font-medium flex items-center justify-end space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span>Beklemede</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              {/* WhatsApp Button */}
              {order.customerPhone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onWhatsAppOpen(order.customerPhone!, order.orderNumber, order.customerName)
                  }}
                  className="
                    flex items-center space-x-1
                    h-8 px-3 bg-green-500 
                    text-white rounded-lg shadow-sm
                    transition-all duration-200
                    text-xs font-medium
                    border-0
                  "
                >
                  <MessageSquareIcon className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              )}

              {/* Undo Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUndoStatusChange(order.id)
                }}
                className="
                  flex items-center space-x-1
                  h-8 px-3 bg-orange-500 
                  text-white rounded-lg shadow-sm
                  transition-all duration-200
                  text-xs font-medium
                  border-0
                "
                title="Son işlemi geri al"
              >
                <ArrowRightIcon className="w-3 h-3 rotate-180" />
                <span>Geri Al</span>
              </button>

              {/* Status Update Dropdown */}
              {possibleNextStatuses.length > 0 && (
                <div className="relative status-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsStatusDropdownOpen(!isStatusDropdownOpen)
                    }}
                    className="
                      flex items-center space-x-1
                      h-8 px-3 bg-purple-500 
                      text-white rounded-lg shadow-sm
                      transition-all duration-200
                      text-xs font-medium
                      border-0
                    "
                  >
                    <ArrowRightIcon className="w-3 h-3" />
                    <span>İlerlet</span>
                    <ChevronDownIcon className="w-3 h-3 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {isStatusDropdownOpen && (
                    <div className="absolute z-50 top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-lg overflow-hidden">
                      <div className="py-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {possibleNextStatuses.map((status) => (
                          <button
                            key={status.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Updating status to:', status.value, 'for order:', order.id)
                              if (status.value && status.value.trim() !== '') {
                                onStatusUpdate(order.id, status.value, order.status)
                                setIsStatusDropdownOpen(false)
                              } else {
                                console.error('Invalid status value:', status.value)
                              }
                            }}
                            className="
                              w-full px-4 py-3 text-left text-sm
                              transition-all duration-200 flex items-center space-x-3
                              text-gray-900 hover:bg-purple-50
                            "
                          >
                            <span className="text-sm">{status.icon}</span>
                            <span className="font-medium text-sm">{status.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <PackageIcon className="w-4 h-4" />
              <span>{orderItems.length} ürün</span>
            </div>
            {order.order_source && (
              <div className="flex items-center space-x-1">
                <MapPinIcon className="w-4 h-4" />
                <span>{order.order_source}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Toggle Button */}
        <div className="border-t border-gray-200/50 pt-4">
          <button
            onClick={toggleDetails}
            className="w-full bg-white/80 text-gray-700 border border-gray-300 shadow-sm py-3 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              {isDetailsExpanded ? (
                <>
                  <ChevronDownIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Detayları Gizle</span>
                </>
              ) : (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Detayları Göster</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Expandable Details */}
        {isDetailsExpanded && (
          <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {/* Email */}
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/50 text-center">
                <MailIcon className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-blue-700 mb-1">Email</p>
                <p className="text-xs text-gray-800 truncate">{order.customerEmail}</p>
              </div>

              {/* Phone */}
              {order.customerPhone && (
                <div className="p-4 bg-green-50/80 rounded-xl border border-green-200/50 text-center">
                  <PhoneIcon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-green-700 mb-1">Telefon</p>
                  <p className="text-xs text-gray-800">{order.customerPhone}</p>
                </div>
              )}

              {/* Date */}
              <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200/50 text-center">
                <CalendarIcon className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-purple-700 mb-1">Sipariş Tarihi</p>
                <p className="text-xs text-gray-800">{formatDate(order.createdAt)}</p>
              </div>

              {/* Payment */}
              <div className="p-4 bg-orange-50/80 rounded-xl border border-orange-200/50 text-center">
                <CurrencyDollarIcon className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-orange-700 mb-1">Ödeme</p>
                <p className="text-xs text-gray-800">{order.payment_method || 'Belirtilmemiş'}</p>
              </div>

              {/* Product Count */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/50 text-center">
                <PackageIcon className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700 mb-1">Ürün Sayısı</p>
                <p className="text-sm font-bold text-gray-800">{orderItems.length}</p>
              </div>

              {/* Order Source */}
              {order.order_source && (
                <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200/50 text-center">
                  <MapPinIcon className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-indigo-700 mb-1">Kaynak</p>
                  <p className="text-xs text-gray-800">{order.order_source}</p>
                </div>
              )}
            </div>

            {/* Products and Shipping - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products */}
              <div className="bg-white/80 rounded-xl border border-gray-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <PackageIcon className="w-5 h-5 text-orange-600" />
                  <h4 className="text-lg font-bold text-gray-800">
                    Ürünler ({orderItems.length})
                  </h4>
                </div>

                {orderItems.length > 0 ? (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        {item.product?.product_images && item.product.product_images.length > 0 ? (
                          <img 
                            src={item.product.product_images[0].url} 
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <PackageIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm text-gray-900">
                            {item.product?.name || 'Ürün'}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.quantity} adet × ₺{item.price.toFixed(2)} = 
                            <span className="font-bold text-emerald-600 ml-1">₺{(item.quantity * item.price).toFixed(2)}</span>
                          </p>
                          {item.personalization && (
                            <p className="text-xs text-blue-600 mt-1 font-mono">
                              Kişiselleştirme: {JSON.stringify(item.personalization, null, 2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PackageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Bu siparişte henüz ürün eklenmemiş</p>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-white/80 rounded-xl border border-gray-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPinIcon className="w-5 h-5 text-amber-600" />
                  <h4 className="text-lg font-bold text-gray-800">Teslimat Adresi</h4>
                </div>

                {order.shippingAddress ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">
                      {order.shippingAddress}
                    </p>
                    {order.shippingCity && (
                      <p className="text-sm text-gray-600">{order.shippingCity}</p>
                    )}
                    {order.shippingCountry && (
                      <p className="text-sm text-gray-500">{order.shippingCountry}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Teslimat adresi belirtilmemiş</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            {(order.amount_received || order.discount_amount || order.labor_cost || order.remaining_payment) && (
              <div className="bg-white/80 rounded-xl border border-gray-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-lg font-bold text-gray-800">Finansal Özet</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {order.amount_received && (
                    <div className="p-4 bg-green-50/80 rounded-lg border border-green-200/50 text-center">
                      <p className="text-xs font-medium text-green-700 mb-1">Alınan Ödeme</p>
                      <p className="text-lg font-bold text-green-800">
                        ₺{(order.amount_received || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {order.discount_amount && (
                    <div className="p-4 bg-red-50/80 rounded-lg border border-red-200/50 text-center">
                      <p className="text-xs font-medium text-red-700 mb-1">İskonto</p>
                      <p className="text-lg font-bold text-red-800">
                        ₺{(order.discount_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {order.labor_cost && (
                    <div className="p-4 bg-blue-50/80 rounded-lg border border-blue-200/50 text-center">
                      <p className="text-xs font-medium text-blue-700 mb-1">İşçilik</p>
                      <p className="text-lg font-bold text-blue-800">
                        ₺{(order.labor_cost || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {order.remaining_payment && (order.remaining_payment || 0) > 0 && (
                    <div className="p-4 bg-orange-50/80 rounded-lg border border-orange-200/50 text-center">
                      <p className="text-xs font-medium text-orange-700 mb-1">Kalan Ödeme</p>
                      <p className="text-lg font-bold text-orange-800">
                        ₺{(order.remaining_payment || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profit Analysis */}
            {(order.net_profit || order.profit_margin_percent) && (
              <div className="bg-white/80 rounded-xl border border-gray-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUpIcon className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-bold text-gray-800">Kar Analizi</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.net_profit && (
                    <div className="p-4 bg-emerald-50/80 rounded-lg border border-emerald-200/50 text-center">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Net Kar</p>
                      <p className="text-xl font-bold text-emerald-800">
                        ₺{(order.net_profit || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {order.profit_margin_percent && (
                    <div className="p-4 bg-purple-50/80 rounded-lg border border-purple-200/50 text-center">
                      <p className="text-xs font-medium text-purple-700 mb-1">Kar Marjı</p>
                      <p className="text-xl font-bold text-purple-800">
                        %{(order.profit_margin_percent || 0).toFixed(1)}
                      </p>
                    </div>
                  )}

                  {order.total_cost && (
                    <div className="p-4 bg-gray-50/80 rounded-lg border border-gray-200/50 text-center">
                      <p className="text-xs font-medium text-gray-700 mb-1">Toplam Maliyet</p>
                      <p className="text-xl font-bold text-gray-800">
                        ₺{(order.total_cost || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes and Quick Edit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin Notes */}
              <div className="bg-amber-50/80 rounded-xl border border-amber-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <EyeIcon className="w-5 h-5 text-amber-600" />
                  <h4 className="text-lg font-bold text-amber-800">Admin Notları</h4>
                </div>
                <Textarea
                  defaultValue={order.admin_notes || ''}
                  placeholder="Bu sipariş hakkında önemli notlar yazın..."
                  className="min-h-[120px] text-sm bg-white/60 border-amber-200/50 resize-none focus:ring-1 focus:ring-amber-500/20 rounded-lg p-3"
                  onChange={(e) => {
                    const timeoutId = setTimeout(() => {
                      onFieldUpdate(order.id, 'admin_notes', e.target.value)
                    }, 1000)
                    return () => clearTimeout(timeoutId)
                  }}
                />
              </div>

              {/* Quick Edit */}
              <div className="bg-blue-50/80 rounded-xl border border-blue-200/50 p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-bold text-blue-800">Hızlı Düzenleme</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-blue-700 mb-2 block">Alınan (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={order.amount_received || 0}
                      className="h-10 text-sm bg-white/60 border-blue-200/50 focus:ring-1 focus:ring-blue-500/20"
                      onChange={(e) => onFieldUpdate(order.id, 'amount_received', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-blue-700 mb-2 block">İskonto (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={order.discount_amount || 0}
                      className="h-10 text-sm bg-white/60 border-blue-200/50 focus:ring-1 focus:ring-blue-500/20"
                      onChange={(e) => onFieldUpdate(order.id, 'discount_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-blue-700 mb-2 block">İşçilik (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={order.labor_cost || 0}
                      className="h-10 text-sm bg-white/60 border-blue-200/50 focus:ring-1 focus:ring-blue-500/20"
                      onChange={(e) => onFieldUpdate(order.id, 'labor_cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-blue-700 mb-2 block">Maliyet (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={order.total_cost || 0}
                      className="h-10 text-sm bg-white/60 border-blue-200/50 focus:ring-1 focus:ring-blue-500/20"
                      onChange={(e) => onFieldUpdate(order.id, 'total_cost', parseFloat(e.target.value) || 0)}
                    />
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
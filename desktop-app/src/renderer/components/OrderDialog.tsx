import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Label } from './ui/Label'
import { Textarea } from './ui/Textarea'
import { Input } from './ui/Input'
import { 
  EyeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
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

interface OrderDialogProps {
  order: Order
  orderItems: OrderItem[]
  trigger: React.ReactNode
  onFieldUpdate: (orderId: string, field: string, value: any) => void
  formatDate: (dateString: string) => string
  getStatusText: (status: string) => string
}

export const OrderDialog: React.FC<OrderDialogProps> = ({
  order,
  orderItems,
  trigger,
  onFieldUpdate,
  formatDate,
  getStatusText
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' }
      case 'CONFIRMED':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✅' }
      case 'PROCESSING':
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '⚙️' }
      case 'READY_TO_SHIP':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '📦' }
      case 'SHIPPED':
        return { bg: 'bg-violet-100', text: 'text-violet-800', icon: '🚚' }
      case 'DELIVERED':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '🎉' }
      case 'CANCELLED':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋' }
    }
  }

  const statusConfig = getStatusConfig(order.status)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl">
        <DialogHeader className="p-6 border-b border-gray-200/50">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <EyeIcon className="h-5 w-5 text-white" />
            </div>
            Sipariş Detayı - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Expand/Collapse Button */}
          <div className="flex justify-center">
            <Button
              onClick={toggleExpansion}
              variant="outline"
              className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-sm px-8 py-3"
            >
              <div className="flex items-center justify-center space-x-2">
                {isExpanded ? (
                  <>
                    <ChevronDownIcon className="h-4 w-4" />
                    <span>Detayları Gizle</span>
                  </>
                ) : (
                  <>
                    <ChevronRightIcon className="h-4 w-4" />
                    <span>Detayları Göster</span>
                  </>
                )}
              </div>
            </Button>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
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
      </DialogContent>
    </Dialog>
  )
}
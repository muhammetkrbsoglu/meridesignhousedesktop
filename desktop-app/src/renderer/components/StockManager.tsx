import React, { useState, useEffect } from 'react'
import { DatabaseService } from '../services/database'
import { supabase } from '../SupabaseClient'
import { 
  XIcon, 
  AlertTriangleIcon, 
  CheckIcon, 
  SpinnerIcon, 
  RefreshIcon, 
  PlusIcon, 
  MinusIcon, 
  EditIcon, 
  PackageIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon
} from './icons/index'

interface Product {
  id: string
  name: string
  sku?: string
  stock: number
  price: number
  categoryId?: string
  category?: { id: string, name: string }
  isFeatured: boolean
  isNewArrival: boolean
  hasVariants: boolean
  is_personalizable: boolean
}

interface SemiFinished {
  id: string
  name: string
  stock_quantity: number
  stock_unit: string
  unit_price_try: number
  max_stock_quantity?: number
  is_semi_finished: boolean
  description?: string
  supplier_id?: string
  supplier?: {
    id: string
    name: string
    contact_person?: string
    phone?: string
    email?: string
  }
}

interface Category {
  id: string
  name: string
  parent_id?: string
}

type StockItem = Product | SemiFinished
type StockItemType = 'product' | 'semi_finished'

type ActiveView = 'dashboard' | 'stock' | 'orders' | 'suppliers' | 'products' | 'semi-finished' | 'reports' | 'settings' | 'test'

interface StockManagerProps {
  onNavigate?: (view: ActiveView) => void
}

export const StockManager: React.FC<StockManagerProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [semiFinished, setSemiFinished] = useState<SemiFinished[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<StockItemType>('product')
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all')
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0)
  const [stockMovements, setStockMovements] = useState<any[]>([])
  const [dashboardAlerts, setDashboardAlerts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [products, semiFinished, searchTerm, selectedCategory, selectedType, selectedStockStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadProducts(),
        loadSemiFinished(),
        loadCategories(),
        loadDashboardAlerts()
      ])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dashboard alerts yükle
  const loadDashboardAlerts = async () => {
    try {
      const { data: lowStock, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_semi_finished', true)
        .not('stock_quantity', 'is', null)
        .not('min_stock_quantity', 'is', null)

      if (error) throw error

      const alerts = (lowStock || []).map((material: any) => {
        const stock = material.stock_quantity || 0
        const minStock = material.min_stock_quantity || 0
        
        if (stock <= minStock) {
          return {
            type: 'critical',
            message: `${material.name} kritik stok seviyesinde (${stock}/${minStock})`,
            materialId: material.id,
            materialName: material.name
          }
        } else if (stock <= minStock * 1.2) {
          return {
            type: 'warning',
            message: `${material.name} düşük stok seviyesinde (${stock}/${minStock})`,
            materialId: material.id,
            materialName: material.name
          }
        }
        return null
      }).filter(Boolean)

      setDashboardAlerts(alerts)
    } catch (error) {
      console.error('Dashboard alerts yüklenirken hata:', error)
    }
  }

  // Stok hareket geçmişi yükle
  const loadStockMovements = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          raw_materials(name)
        `)
        .eq('raw_material_id', itemId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setStockMovements(data || [])
    } catch (error) {
      console.error('Stok hareketleri yüklenirken hata:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const loadSemiFinished = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .eq('is_semi_finished', true)
        .order('name')

      if (error) throw error
      setSemiFinished(data || [])
    } catch (error) {
      console.error('Yarı mamuller yüklenirken hata:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
    }
  }

  const filterItems = () => {
    let items: StockItem[] = []
    
    if (selectedType === 'product') {
      items = [...products]
    } else {
      items = [...semiFinished]
    }

    // Arama filtresi
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('sku' in item && item.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Kategori filtresi (sadece ürünler için)
    if (selectedCategory !== 'all' && selectedType === 'product') {
      items = items.filter(item => 
        'categoryId' in item && item.categoryId === selectedCategory
      )
    }

    // Stok durumu filtresi
    if (selectedStockStatus !== 'all') {
      items = items.filter(item => {
        const stock = getItemStock(item)
        if (selectedStockStatus === 'low') {
          return stock > 0 && stock < 10
        } else if (selectedStockStatus === 'out') {
          return stock <= 0
        } else if (selectedStockStatus === 'normal') {
          return stock >= 10
        }
        return true
      })
    }

    setFilteredItems(items)
  }

  const updateStock = async (item: StockItem, newStock: number, movementType: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    try {
      console.log('Stok güncelleme başlıyor:', { itemId: item.id, newStock, movementType, selectedType })
      
      if (selectedType === 'product') {
        const { data, error } = await supabase
          .from('products')
          .update({ 
            stock: newStock,
            updatedAt: new Date().toISOString()
          })
          .eq('id', item.id)
          .select()
        
        if (error) {
          console.error('Ürün stok güncelleme hatası:', error)
          throw error
        }
        console.log('Ürün stok güncellendi:', data)
      } else {
        const { data, error } = await supabase
          .from('raw_materials')
          .update({ 
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .select()
        
        if (error) {
          console.error('Yarı mamul stok güncelleme hatası:', error)
          throw error
        }
        console.log('Yarı mamul stok güncellendi:', data)
      }

      // Stok hareketi kaydı ekle (sadece yarı mamuller için)
      if (selectedType === 'semi_finished') {
        await supabase
          .from('stock_movements')
          .insert({
            raw_material_id: item.id,
            movement_type: movementType,
            quantity: movementType === 'OUT' ? -Math.abs(adjustmentAmount) : Math.abs(adjustmentAmount),
            unit: (item as SemiFinished).stock_unit,
            reason: `Stok güncellemesi: ${movementType}`
          })
      }

      await loadData()
      setShowDetailModal(false)
      setAdjustmentAmount(0)
    } catch (error) {
      console.error('Stok güncellenirken hata:', error)
    }
  }

  const getStockStatus = (item: StockItem) => {
    const stock = selectedType === 'product' ? (item as Product).stock : (item as SemiFinished).stock_quantity
    const maxStock = selectedType === 'semi_finished' ? (item as SemiFinished).max_stock_quantity : null
    
    if (stock <= 0) return { text: 'Stok Yok', color: 'bg-red-500', icon: XIcon }
    if (maxStock && stock < maxStock * 0.2) return { text: 'Düşük Stok', color: 'bg-yellow-500', icon: AlertTriangleIcon }
    if (stock < 10) return { text: 'Düşük Stok', color: 'bg-yellow-500', icon: AlertTriangleIcon }
    return { text: 'Stok Var', color: 'bg-green-500', icon: CheckIcon }
  }

  const handleStockAdjustment = (item: StockItem) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const getItemStock = (item: StockItem): number => {
    return selectedType === 'product' ? (item as Product).stock : (item as SemiFinished).stock_quantity
  }

  const getItemPrice = (item: StockItem): number => {
    if (selectedType === 'product') {
      return (item as Product).price || 0
    } else {
      return (item as SemiFinished).unit_price_try || 0
    }
  }

  const getItemUnit = (item: StockItem): string => {
    return selectedType === 'product' ? 'adet' : (item as SemiFinished).stock_unit
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Stok Yönetimi</h1>
        <div className="flex items-center gap-3">
          {/* Hızlı Erişim Butonları */}
          <button
            onClick={() => onNavigate?.('reports')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Raporlar"
          >
            <ChartBarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Raporlar</span>
          </button>
          
          <button
            onClick={() => onNavigate?.('suppliers')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Tedarikçiler"
          >
            <BuildingOfficeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tedarikçiler</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
            Yenile
          </button>
        </div>
      </div>

      {/* Dashboard Alerts */}
      {dashboardAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">Stok Uyarıları</h3>
          </div>
          <div className="space-y-2">
            {dashboardAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded ${
                alert.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <span className="text-sm">{alert.message}</span>
                <button
                  onClick={() => {
                    setSearchTerm(alert.materialName)
                    setSelectedType('semi_finished')
                  }}
                  className="text-xs underline hover:no-underline"
                >
                  Görüntüle
                </button>
              </div>
            ))}
            {dashboardAlerts.length > 3 && (
              <p className="text-xs text-yellow-700">
                +{dashboardAlerts.length - 3} uyarı daha...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as StockItemType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="product">Ürünler</option>
            <option value="semi_finished">Yarı Mamuller</option>
          </select>
        </div>

        {selectedType === 'product' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stok Durumu</label>
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="low">Düşük Stok</option>
            <option value="out">Stok Yok</option>
            <option value="normal">Normal Stok</option>
          </select>
        </div>
      </div>

      {/* Stok Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <PackageIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <PackageIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Yarı Mamul</p>
              <p className="text-2xl font-bold text-gray-900">{semiFinished.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Düşük Stok</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredItems.filter(item => {
                  const stock = getItemStock(item)
                  return stock > 0 && stock < 10
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stok Yok</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredItems.filter(item => getItemStock(item) <= 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stok Listesi */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedType === 'product' ? 'Ürün Stokları' : 'Yarı Mamul Stokları'}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedType === 'product' ? 'Ürün' : 'Yarı Mamul'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
                </th>
                {selectedType === 'product' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                )}
                {selectedType === 'semi_finished' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const StatusIcon = stockStatus.icon
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {selectedType === 'product' && 'sku' in item && item.sku && (
                          <div className="text-sm text-gray-500">{item.sku}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getItemStock(item)} {getItemUnit(item)}
                      </div>
                      {selectedType === 'semi_finished' && (item as SemiFinished).max_stock_quantity && (
                        <div className="text-xs text-gray-500">
                          Max: {(item as SemiFinished).max_stock_quantity} {getItemUnit(item)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₺{(getItemPrice(item) || 0).toFixed(2)}
                      </div>
                    </td>
                    {selectedType === 'product' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(item as Product).category?.name || 'Kategorisiz'}
                        </div>
                      </td>
                    )}
                    {selectedType === 'semi_finished' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(item as SemiFinished).supplier?.name || 'Tedarikçi Yok'}
                        </div>
                        {(item as SemiFinished).supplier?.contact_person && (
                          <div className="text-xs text-gray-500">
                            {(item as SemiFinished).supplier?.contact_person}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${stockStatus.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStockAdjustment(item)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Stok Düzenle"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        {selectedType === 'semi_finished' && (
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              loadStockMovements(item.id)
                              setShowMovementModal(true)
                            }}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Stok Hareket Geçmişi"
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                          </button>
                        )}
                        {selectedType === 'semi_finished' && (item as SemiFinished).supplier && (
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setShowSupplierModal(true)
                            }}
                            className="text-purple-600 hover:text-purple-900 transition-colors"
                            title="Tedarikçi Bilgileri"
                          >
                            <BuildingOfficeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setShowDetailModal(true)
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Detaylar"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedType === 'product' ? 'Ürün' : 'Yarı mamul'} bulunamadı
          </h3>
          <p className="text-gray-500">
            Arama kriterlerinize uygun {selectedType === 'product' ? 'ürün' : 'yarı mamul'} bulunamadı.
          </p>
        </div>
      )}

      {/* Stok Düzenleme Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stok Düzenle - {selectedItem.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Stok
                </label>
                <input
                  type="text"
                  value={`${getItemStock(selectedItem)} ${getItemUnit(selectedItem)}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miktar
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  placeholder="Miktar girin..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => updateStock(selectedItem, getItemStock(selectedItem) + adjustmentAmount, adjustmentAmount > 0 ? 'IN' : 'OUT')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Güncelle
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedItem(null)
                  setAdjustmentAmount(0)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stok Hareket Geçmişi Modal */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Stok Hareket Geçmişi - {selectedItem.name}
              </h3>
              <button
                onClick={() => {
                  setShowMovementModal(false)
                  setSelectedItem(null)
                  setStockMovements([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {stockMovements.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz stok hareketi yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockMovements.map((movement) => (
                    <div key={movement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {movement.movement_type === 'IN' ? 'Stok Girişi' :
                           movement.movement_type === 'OUT' ? 'Stok Çıkışı' :
                           movement.movement_type === 'RETURN' ? 'Stok İadesi' : 'Stok Düzeltmesi'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.created_at).toLocaleString('tr-TR')}
                        </p>
                        {movement.reason && (
                          <p className="text-xs text-gray-600 mt-1">{movement.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          movement.movement_type === 'OUT' ? 'text-red-600' :
                          movement.movement_type === 'IN' ? 'text-green-600' :
                          movement.movement_type === 'RETURN' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {movement.movement_type === 'OUT' ? '-' : '+'}{movement.quantity} {movement.unit || 'adet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tedarikçi Bilgileri Modal */}
      {showSupplierModal && selectedItem && (selectedItem as SemiFinished).supplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tedarikçi Bilgileri - {(selectedItem as SemiFinished).supplier?.name}
              </h3>
              <button
                onClick={() => {
                  setShowSupplierModal(false)
                  setSelectedItem(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Adı</label>
                <p className="text-sm text-gray-900">{(selectedItem as SemiFinished).supplier?.name}</p>
              </div>
              
              {(selectedItem as SemiFinished).supplier?.contact_person && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Kişisi</label>
                  <p className="text-sm text-gray-900">{(selectedItem as SemiFinished).supplier?.contact_person}</p>
                </div>
              )}
              
              {(selectedItem as SemiFinished).supplier?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <p className="text-sm text-gray-900">{(selectedItem as SemiFinished).supplier?.phone}</p>
                </div>
              )}
              
              {(selectedItem as SemiFinished).supplier?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <p className="text-sm text-gray-900">{(selectedItem as SemiFinished).supplier?.email}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme Bilgisi</label>
                <p className="text-sm text-gray-900">{selectedItem.name}</p>
                <p className="text-xs text-gray-500">
                  Mevcut Stok: {getItemStock(selectedItem)} {getItemUnit(selectedItem)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSupplierModal(false)
                  setSelectedItem(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowSupplierModal(false)
                  setSelectedItem(null)
                  onNavigate?.('suppliers')
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tedarikçi Yönetimi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
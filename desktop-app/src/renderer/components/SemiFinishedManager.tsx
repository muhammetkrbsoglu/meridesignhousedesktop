import React, { useState, useEffect } from 'react'
import { DatabaseService } from '../services/database'
import { supabase } from '../SupabaseClient'
import { SearchIcon, PlusIcon, LinkIcon, EyeIcon, EditIcon, TrashIcon } from '../components/icons'

interface SemiFinished {
  id: string
  name: string
  description?: string
  stock_unit: string
  stock_quantity: number
  min_stock_quantity: number
  max_stock_quantity: number
  unit_price_try: number
  supplier_id?: string
  supplier_name?: string
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  name: string
  price: number
  category?: string
}

interface ProductRelation {
  id: string
  product_id: string
  raw_material_id: string
  quantity: number
  unit: string
  notes?: string
  product?: Product
}

export default function SemiFinishedManager() {
  const [semiFinished, setSemiFinished] = useState<SemiFinished[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierRelations, setSupplierRelations] = useState<any[]>([])
  const [relations, setRelations] = useState<ProductRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedSemiFinished, setSelectedSemiFinished] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<SemiFinished | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [linkQuantity, setLinkQuantity] = useState(1)
  const [linkUnit, setLinkUnit] = useState('adet')
  const [linkNotes, setLinkNotes] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all')
  const [expandedProductCategories, setExpandedProductCategories] = useState<Set<string>>(new Set())
  
  // Toplu silme için yeni state'ler
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  const db = new DatabaseService()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadSemiFinished(),
        loadProducts(),
        loadSuppliers(),
        loadSupplierRelations(),
        loadRelations()
      ])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSemiFinished = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          suppliers:suppliers(id, name)
        `)
        .eq('is_semi_finished', true)
        .order('name')

      if (error) throw error
      setSemiFinished(data?.map((item: any) => ({
        ...item,
        supplier_name: item.suppliers?.name
      })) || [])
    } catch (error) {
      console.error('Yarı mamuller yüklenirken hata:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Tedarikçiler yüklenirken hata:', error)
    }
  }

  const loadSupplierRelations = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials_suppliers')
        .select(`
          *,
          supplier:suppliers(id, name)
        `)

      if (error) throw error
      setSupplierRelations(data || [])
    } catch (error) {
      console.error('Tedarikçi ilişkileri yüklenirken hata:', error)
    }
  }

  const loadRelations = async () => {
    try {
      const { data, error } = await supabase
        .from('product_raw_material_relations')
        .select(`
          *,
          product:products(id, name, price)
        `)

      if (error) throw error
      setRelations(data || [])
    } catch (error) {
      console.error('İlişkiler yüklenirken hata:', error)
    }
  }

  const handleAddSemiFinished = async (formData: any) => {
    try {
      const { supplier_ids, ...semiFinishedData } = formData
      
      // Yarı mamul ekle
      const { data, error } = await supabase
        .from('raw_materials')
        .insert([{
          ...semiFinishedData,
          is_semi_finished: true
        }])
        .select()

      if (error) throw error

      // Tedarikçi ilişkilerini ekle
      if (supplier_ids && supplier_ids.length > 0) {
        const supplierRelations = supplier_ids.map((supplierId: string) => ({
          raw_material_id: data[0].id,
          supplier_id: supplierId
        }))

        const { error: relationError } = await supabase
          .from('raw_materials_suppliers')
          .insert(supplierRelations)

        if (relationError) throw relationError
      }

      await Promise.all([loadSemiFinished(), loadSupplierRelations()])
      setShowAddModal(false)
    } catch (error) {
      console.error('Yarı mamul eklenirken hata:', error)
    }
  }

  const handleEditSemiFinished = async (formData: any) => {
    if (!editingItem) return

    try {
      const { supplier_ids, ...semiFinishedData } = formData
      
      // Yarı mamul güncelle
      const { error } = await supabase
        .from('raw_materials')
        .update(semiFinishedData)
        .eq('id', editingItem.id)

      if (error) throw error

      // Mevcut tedarikçi ilişkilerini sil
      const { error: deleteError } = await supabase
        .from('raw_materials_suppliers')
        .delete()
        .eq('raw_material_id', editingItem.id)

      if (deleteError) throw deleteError

      // Yeni tedarikçi ilişkilerini ekle
      if (supplier_ids && supplier_ids.length > 0) {
        const supplierRelations = supplier_ids.map((supplierId: string) => ({
          raw_material_id: editingItem.id,
          supplier_id: supplierId
        }))

        const { error: relationError } = await supabase
          .from('raw_materials_suppliers')
          .insert(supplierRelations)

        if (relationError) throw relationError
      }

      await Promise.all([loadSemiFinished(), loadSupplierRelations()])
      setShowEditModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Yarı mamul güncellenirken hata:', error)
    }
  }

  const handleEditClick = (item: SemiFinished) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleDeleteRelationFromEdit = async (relationId: string) => {
    if (!confirm('Bu bağlantıyı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('product_raw_material_relations')
        .delete()
        .eq('id', relationId)

      if (error) throw error
      await loadRelations()
    } catch (error) {
      console.error('Bağlantı silinirken hata:', error)
    }
  }

  const handleLinkProducts = async () => {
    if (!selectedSemiFinished || selectedProducts.length === 0) return

    try {
      // Seçilen tüm ürünler için ayrı ayrı bağlantı oluştur
      const relations = selectedProducts.map(productId => ({
        product_id: productId,
        raw_material_id: selectedSemiFinished,
        quantity: linkQuantity,
        unit: linkUnit,
        notes: linkNotes
      }))

      const { error } = await supabase
        .from('product_raw_material_relations')
        .insert(relations)

      if (error) throw error
      await loadRelations()
      setShowLinkModal(false)
      setSelectedSemiFinished(null)
      setSelectedProducts([])
      setLinkQuantity(1)
      setLinkUnit('adet')
      setLinkNotes('')
    } catch (error) {
      console.error('Ürünler bağlanırken hata:', error)
    }
  }

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAllProducts = () => {
    // Zaten bağlı ürünleri hariç tut
    const alreadyLinkedProductIds = relations
      .filter(rel => rel.raw_material_id === selectedSemiFinished)
      .map(rel => rel.product_id)
    
    const availableProducts = products
      .filter(p => !alreadyLinkedProductIds.includes(p.id))
      .map(p => p.id)
    
    setSelectedProducts(availableProducts)
  }

  const handleDeselectAllProducts = () => {
    setSelectedProducts([])
  }

  const handleDeleteRelation = async (relationId: string) => {
    if (!confirm('Bu bağlantıyı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('product_raw_material_relations')
        .delete()
        .eq('id', relationId)

      if (error) throw error
      await loadRelations()
    } catch (error) {
      console.error('Bağlantı silinirken hata:', error)
    }
  }

  const filteredSemiFinished = semiFinished.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProductRelations = (semiFinishedId: string) => {
    return relations.filter(rel => rel.raw_material_id === semiFinishedId)
  }

  // Toplu silme fonksiyonları
  const handleBulkDeleteMode = () => {
    setBulkDeleteMode(!bulkDeleteMode)
    setSelectedItems([]) // Seçimleri temizle
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    const allItemIds = filteredSemiFinished.map(item => item.id)
    setSelectedItems(allItemIds)
  }

  const handleDeselectAll = () => {
    setSelectedItems([])
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    try {
      // Önce bağlı ürünleri kontrol et
      const itemsWithRelations = selectedItems.filter(itemId => {
        const itemRelations = relations.filter(rel => rel.raw_material_id === itemId)
        return itemRelations.length > 0
      })

      if (itemsWithRelations.length > 0) {
        alert(`${itemsWithRelations.length} yarı mamulün bağlı ürünleri var. Önce bu bağlantıları kaldırın.`)
        return
      }

      // Tedarikçi ilişkilerini sil
      await supabase
        .from('raw_materials_suppliers')
        .delete()
        .in('raw_material_id', selectedItems)

      // Yarı mamulleri sil
      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .in('id', selectedItems)

      if (error) throw error

      // Verileri yenile
      await loadData()
      
      // State'leri temizle
      setSelectedItems([])
      setBulkDeleteMode(false)
      setShowDeleteConfirmModal(false)
      
      alert(`${selectedItems.length} yarı mamul başarıyla silindi.`)
    } catch (error) {
      console.error('Toplu silme hatası:', error)
      alert('Toplu silme işlemi başarısız oldu.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Yarı Mamuller</h2>
          <div className="flex items-center gap-3">
            {bulkDeleteMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} öğe seçildi
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Seçimi Temizle
                </button>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirmModal(true)}
                    className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Seçilenleri Sil ({selectedItems.length})
                  </button>
                )}
              </div>
            )}
            <button
              onClick={handleBulkDeleteMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                bulkDeleteMode 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <TrashIcon className="h-5 w-5" />
              {bulkDeleteMode ? 'Toplu Silme Kapalı' : 'Toplu Silme'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Yarı Mamul Ekle
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Yarı mamul ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Semi-Finished Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSemiFinished.map((item) => {
          const productRelations = getProductRelations(item.id)
          
          return (
            <div key={item.id} className={`bg-white rounded-lg shadow p-6 transition-all duration-200 ${
              bulkDeleteMode ? 'border-2 border-gray-200' : ''
            } ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {bulkDeleteMode && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                </div>
                {!bulkDeleteMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedSemiFinished(item.id)
                        setShowLinkModal(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ürün Bağla"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {item.description && (
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              )}

              {/* Stock Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Mevcut Stok</p>
                  <p className="font-semibold text-lg">
                    {item.stock_quantity || 0} {item.stock_unit || 'adet'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Maliyet</p>
                  <p className="font-semibold text-lg text-green-600">
                    ₺{(item.unit_price_try || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Min: {item.min_stock_quantity || 0} {item.stock_unit || 'adet'}</span>
                  <span>Max: {item.max_stock_quantity || 100} {item.stock_unit || 'adet'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (item.stock_quantity || 0) <= (item.min_stock_quantity || 0)
                        ? 'bg-red-500'
                        : (item.stock_quantity || 0) >= (item.max_stock_quantity || 100)
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        ((item.stock_quantity || 0) / (item.max_stock_quantity || 100)) * 100,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Supplier Info */}
              {(() => {
                const itemSupplierRelations = supplierRelations.filter(rel => rel.raw_material_id === item.id)
                return itemSupplierRelations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Tedarikçiler:</p>
                    <div className="flex flex-wrap gap-1">
                      {itemSupplierRelations.map((rel, index) => (
                        <span key={rel.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {rel.supplier?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Linked Products */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Bağlı Ürünler ({productRelations.length})
                </p>
                {productRelations.length > 0 ? (
                  <div className="space-y-2">
                    {productRelations.map((relation) => (
                      <div key={relation.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <p className="text-sm font-medium">{relation.product?.name}</p>
                          <p className="text-xs text-gray-500">
                            {relation.quantity} {relation.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRelation(relation.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Henüz ürün bağlanmamış</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredSemiFinished.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Yarı mamul bulunamadı</p>
          <p className="text-gray-400 text-sm mt-1">
            Yeni yarı mamul eklemek için yukarıdaki butonu kullanın
          </p>
        </div>
      )}

      {/* Add Semi-Finished Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yarı Mamul Ekle</h3>
            <AddSemiFinishedForm
              onSubmit={handleAddSemiFinished}
              onCancel={() => setShowAddModal(false)}
              suppliers={suppliers}
              supplierRelations={supplierRelations}
            />
          </div>
        </div>
      )}

      {/* Edit Semi-Finished Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Yarı Mamul Düzenle</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol Taraf - Form */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Genel Bilgiler</h4>
                <AddSemiFinishedForm
                  onSubmit={handleEditSemiFinished}
                  onCancel={() => {
                    setShowEditModal(false)
                    setEditingItem(null)
                  }}
                  initialData={editingItem}
                  suppliers={suppliers}
                  supplierRelations={supplierRelations}
                />
              </div>

              {/* Sağ Taraf - Bağlı Ürünler */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Bağlı Ürünler</h4>
                  <button
                    onClick={() => {
                      setSelectedSemiFinished(editingItem.id)
                      setShowLinkModal(true)
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    + Ürün Bağla
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {(() => {
                    const productRelations = relations.filter(rel => rel.raw_material_id === editingItem.id)
                    
                    return productRelations.length > 0 ? (
                      productRelations.map((relation) => (
                        <div key={relation.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{relation.product?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>Miktar: {relation.quantity} {relation.unit}</span>
                              {relation.notes && (
                                <span className="italic">"{relation.notes}"</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteRelationFromEdit(relation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Bağlantıyı Kaldır"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Henüz bağlı ürün yok</p>
                        <p className="text-sm mt-1">Üstteki butona tıklayarak ürün bağlayabilirsiniz</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Products Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Ürünleri Bağla</h3>
            <div className="space-y-4">
              {/* Ürün Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ürünleri Seç ({selectedProducts.length} seçildi)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllProducts}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={handleDeselectAllProducts}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      Tümünü Kaldır
                    </button>
                  </div>
                </div>

                {/* Arama Çubuğu */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Kategori ve Ürün Listesi */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Kategori Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-3">Kategoriler</h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedProductCategory('all')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedProductCategory === 'all'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tümü ({products.length})
                        </button>
                        {products.reduce((acc: any[], product, index) => {
                          const category = acc.find(cat => cat.name === product.category)
                          if (!category) {
                            acc.push({
                              id: product.category || `uncategorized-${index}`,
                              name: product.category || 'Kategorisiz',
                              children: []
                            })
                          }
                          return acc
                        }, []).map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedProductCategory(category.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              selectedProductCategory === category.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ürün Listesi */}
                  <div className="lg:col-span-2">
                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                      {(() => {
                        // Zaten bağlı ürün ID'lerini al
                        const alreadyLinkedProductIds = relations
                          .filter(rel => rel.raw_material_id === selectedSemiFinished)
                          .map(rel => rel.product_id)
                        
                        const filteredProducts = products.filter(product => {
                          const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                          const matchesCategory = selectedProductCategory === 'all' || product.category === selectedProductCategory
                          return matchesSearch && matchesCategory
                        })
                        
                        return filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => {
                            const isAlreadyLinked = alreadyLinkedProductIds.includes(product.id)
                            const isSelected = selectedProducts.includes(product.id)
                            
                            return (
                            <div
                              key={product.id}
                              className={`flex items-center p-2 rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 border border-blue-200'
                                  : isAlreadyLinked
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                              }`}
                              onClick={() => !isAlreadyLinked && handleProductToggle(product.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || isAlreadyLinked}
                                disabled={isAlreadyLinked}
                                onChange={() => !isAlreadyLinked && handleProductToggle(product.id)}
                                className={`mr-3 h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${
                                  isAlreadyLinked 
                                    ? 'text-green-600 bg-green-100' 
                                    : 'text-blue-600'
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  {isAlreadyLinked && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      Zaten Bağlı
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">₺{product.price.toFixed(2)}</p>
                              </div>
                            </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Ürün bulunamadı</p>
                            <p className="text-sm mt-1">Farklı arama terimleri deneyin</p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Miktar ve Birim */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miktar (Tüm ürünler için)
                  </label>
                  <input
                    type="number"
                    value={linkQuantity}
                    onChange={(e) => setLinkQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.001"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birim
                  </label>
                  <input
                    type="text"
                    value={linkUnit}
                    onChange={(e) => setLinkUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="adet"
                  />
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar (Tüm bağlantılar için)
                </label>
                <textarea
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>

              {/* Özet */}
              {selectedProducts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    Özet: {selectedProducts.length} ürün seçildi
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Her ürün için {linkQuantity} {linkUnit} miktarında bağlantı oluşturulacak
                  </p>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleLinkProducts}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {selectedProducts.length > 0 
                    ? `${selectedProducts.length} Ürünü Bağla` 
                    : 'Ürün Seçin'
                  }
                </button>
                <button
                  onClick={() => {
                    setShowLinkModal(false)
                    setSelectedSemiFinished(null)
                    setSelectedProducts([])
                    setLinkQuantity(1)
                    setLinkUnit('adet')
                    setLinkNotes('')
                    setProductSearchTerm('')
                    setSelectedProductCategory('all')
                    setExpandedProductCategories(new Set())
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Silme Onay Modalı */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Toplu Silme Onayı</h3>
                <p className="text-sm text-gray-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>{selectedItems.length}</strong> yarı mamul silinecek:
              </p>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                <ul className="space-y-1">
                  {selectedItems.map(itemId => {
                    const item = filteredSemiFinished.find(i => i.id === itemId)
                    return item ? (
                      <li key={itemId} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        {item.name}
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
                  ⚠️
                </div>
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Dikkat!</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Bu yarı mamullere bağlı ürünler varsa silme işlemi iptal edilir</li>
                    <li>• Tedarikçi ilişkileri otomatik olarak kaldırılır</li>
                    <li>• Bu işlem geri alınamaz</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add Semi-Finished Form Component
function AddSemiFinishedForm({ onSubmit, onCancel, initialData, suppliers, supplierRelations }: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: SemiFinished
  suppliers: any[]
  supplierRelations: any[]
}) {
  // Mevcut tedarikçi ilişkilerini al
  const currentSupplierIds = initialData 
    ? supplierRelations
        .filter(rel => rel.raw_material_id === initialData.id)
        .map(rel => rel.supplier_id)
    : []

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    notes: initialData?.description || '',
    stock_unit: initialData?.stock_unit || 'adet',
    stock_quantity: initialData?.stock_quantity || 0,
    min_stock_quantity: initialData?.min_stock_quantity || 0,
    max_stock_quantity: initialData?.max_stock_quantity || 100,
    unit_price_try: initialData?.unit_price_try || 0,
    supplier_ids: currentSupplierIds
  })

  const handleSupplierToggle = (supplierId: string) => {
    setFormData(prev => ({
      ...prev,
      supplier_ids: prev.supplier_ids.includes(supplierId)
        ? prev.supplier_ids.filter(id => id !== supplierId)
        : [...prev.supplier_ids, supplierId]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ad *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notlar
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birim
          </label>
          <input
            type="text"
            value={formData.stock_unit}
            onChange={(e) => setFormData({...formData, stock_unit: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birim Fiyat (₺)
          </label>
          <input
            type="number"
            value={formData.unit_price_try}
            onChange={(e) => setFormData({...formData, unit_price_try: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mevcut Stok
          </label>
          <input
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({...formData, stock_quantity: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Stok
          </label>
          <input
            type="number"
            value={formData.min_stock_quantity}
            onChange={(e) => setFormData({...formData, min_stock_quantity: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Stok
          </label>
          <input
            type="number"
            value={formData.max_stock_quantity}
            onChange={(e) => setFormData({...formData, max_stock_quantity: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tedarikçiler
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
          {suppliers.length > 0 ? (
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <label key={supplier.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.supplier_ids.includes(supplier.id)}
                    onChange={() => handleSupplierToggle(supplier.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{supplier.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Tedarikçi bulunamadı</p>
          )}
        </div>
        {formData.supplier_ids.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {formData.supplier_ids.length} tedarikçi seçildi
          </p>
        )}
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Güncelle' : 'Ekle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  )
}

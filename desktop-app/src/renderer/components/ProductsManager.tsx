import React, { useState, useEffect } from 'react'
import { DatabaseService } from '../services/database'
import { supabase } from '../SupabaseClient'
import { SearchIcon, FilterIcon, EyeIcon } from '../components/icons'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  sku?: string
  categoryId?: string
  category?: { id: string, name: string }
  image?: string
  isFeatured: boolean
  isNewArrival: boolean
  hasVariants: boolean
  is_personalizable: boolean
  product_variants?: any[]
  personalizationOptions?: any[]
  product_raw_material_relations?: {
    id: string
    quantity: number
    unit: string
    notes?: string
    raw_material: {
      id: string
      name: string
      stock_quantity: number
      stock_unit: string
      unit_price_try: number
    }
  }[]
}

interface Category {
  id: string
  name: string
  parent_id?: string
  children?: Category[]
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const db = new DatabaseService()

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants!product_variants_productId_fkey(*),
          category:categories(id, name),
          product_raw_material_relations!product_raw_material_relations_product_id_fkey(
            id,
            quantity,
            unit,
            notes,
            raw_material:raw_materials(
              id,
              name,
              stock_quantity,
              stock_unit,
              unit_price_try
            )
          )
        `)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      
      // Kategorileri hiyerarşik yapıya dönüştür
      const categoryMap = new Map<string, Category>()
      const rootCategories: Category[] = []

      data?.forEach((cat: any) => {
        const category: Category = {
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id,
          children: []
        }
        categoryMap.set(cat.id, category)

        if (!cat.parent_id) {
          rootCategories.push(category)
        }
      })

      // Alt kategorileri bağla
      data?.forEach((cat: any) => {
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id)
          const child = categoryMap.get(cat.id)
          if (parent && child) {
            parent.children?.push(child)
          }
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  const renderCategories = (categoryList: Category[], level = 0) => {
    return categoryList.map(category => (
      <div key={category.id} className={`ml-${level * 4}`}>
        <button
          onClick={() => {
            setSelectedCategory(category.id)
            if (category.children && category.children.length > 0) {
              toggleCategory(category.id)
            }
          }}
          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
            selectedCategory === category.id
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{category.name}</span>
            {category.children && category.children.length > 0 && (
              <span className={`transform transition-transform ${
                expandedCategories.has(category.id) ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            )}
          </div>
        </button>
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && (
          <div className="ml-4 mt-1">
            {renderCategories(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
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
          <h2 className="text-2xl font-bold text-gray-900">Ürünler</h2>
          <span className="text-sm text-gray-500">
            {filteredProducts.length} ürün
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Kategoriler</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tümü
              </button>
              {renderCategories(categories)}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg">{product.name}</h4>
                  <span className="text-lg font-bold text-blue-600">
                    ₺{product.price.toFixed(2)}
                  </span>
                </div>

                {/* Product Features */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.isFeatured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Öne Çıkan
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Yeni
                    </span>
                  )}
                  {product.hasVariants && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Varyasyonlu
                    </span>
                  )}
                  {product.is_personalizable && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Kişiselleştirilebilir
                    </span>
                  )}
                </div>

                {/* Variants Info */}
                {product.hasVariants && product.product_variants && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">
                      Varyasyonlar: {product.product_variants?.length || 0}
                    </p>
                    <div className="text-xs text-gray-500">
                      {product.product_variants?.slice(0, 3).map((variant: any, index: number) => (
                        <span key={variant.id}>
                          {variant.title || variant.name}
                          {index < Math.min(product.product_variants?.length || 0, 3) - 1 && ', '}
                        </span>
                      ))}
                      {(product.product_variants?.length || 0) > 3 && '...'}
                    </div>
                  </div>
                )}

                {/* Personalization Info */}
                {product.is_personalizable && product.personalizationOptions && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      Kişiselleştirme: {product.personalizationOptions.length} seçenek
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      console.log('Buton tıklandı:', product.name)
                      setSelectedProduct(product)
                      setShowProductDetail(true)
                      console.log('State güncellendi:', { showProductDetail: true, selectedProduct: product.name })
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Detayları Gör
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Ürün bulunamadı</p>
              <p className="text-gray-400 text-sm mt-1">
                Farklı arama terimleri deneyin veya kategori seçin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
              <button
                onClick={() => {
                  setShowProductDetail(false)
                  setSelectedProduct(null)
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sol Taraf - Ürün Bilgileri */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Genel Bilgiler</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ürün Adı:</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fiyat:</span>
                      <span className="font-medium text-green-600">₺{selectedProduct.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stok:</span>
                      <span className="font-medium">{selectedProduct.stock} adet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium">{selectedProduct.sku || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kategori:</span>
                      <span className="font-medium">{selectedProduct.category?.name || 'Kategorisiz'}</span>
                    </div>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Açıklama</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}

                {/* Ürün Özellikleri */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Özellikler</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.isFeatured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                        Öne Çıkan
                      </span>
                    )}
                    {selectedProduct.isNewArrival && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                        Yeni Ürün
                      </span>
                    )}
                    {selectedProduct.hasVariants && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                        Varyasyonlu
                      </span>
                    )}
                    {selectedProduct.is_personalizable && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm font-medium rounded-full">
                        Kişiselleştirilebilir
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Taraf - Varyantlar ve Kişiselleştirme */}
              <div className="space-y-6">
                {/* Varyantlar */}
                {selectedProduct.hasVariants && selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Varyantlar ({selectedProduct.product_variants.length})
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                      {selectedProduct.product_variants.map((variant: any) => (
                        <div key={variant.id} className="flex justify-between items-center p-3 bg-white rounded border">
                          <div>
                            <p className="font-medium">{variant.title}</p>
                            {variant.description && (
                              <p className="text-sm text-gray-600">{variant.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stok: {variant.stock || 0}</p>
                            {variant.sku && (
                              <p className="text-sm text-gray-600">SKU: {variant.sku}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kişiselleştirme Bilgileri */}
                {selectedProduct.is_personalizable && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Kişiselleştirme</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 mb-2">
                        Bu ürün kişiselleştirilebilir. Detaylar web sitesi admin panelinden yönetilir.
                      </p>
                      <div className="text-sm text-gray-600">
                        <p>• Özel metin ekleme</p>
                        <p>• Renk seçenekleri</p>
                        <p>• Boyut seçenekleri</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Yarı Mamul İlişkileri */}
                {selectedProduct.product_raw_material_relations && selectedProduct.product_raw_material_relations.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Bağlı Yarı Mamuller ({selectedProduct.product_raw_material_relations.length})
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                      {selectedProduct.product_raw_material_relations.map((relation) => (
                        <div key={relation.id} className="flex justify-between items-start p-3 bg-white rounded border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{relation.raw_material.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Miktar: {relation.quantity} {relation.unit}</span>
                              <span>Stok: {relation.raw_material.stock_quantity} {relation.raw_material.stock_unit}</span>
                              <span className="text-green-600 font-medium">
                                ₺{relation.raw_material.unit_price_try.toFixed(2)}/{relation.raw_material.stock_unit}
                              </span>
                            </div>
                            {relation.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{relation.notes}"</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              <p>Toplam Maliyet:</p>
                              <p className="font-medium text-green-600">
                                ₺{(relation.quantity * relation.raw_material.unit_price_try).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Toplam Maliyet Özeti */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Toplam Yarı Mamul Maliyeti:</span>
                        <span className="text-lg font-bold text-blue-900">
                          ₺{selectedProduct.product_raw_material_relations.reduce((total, relation) => 
                            total + (relation.quantity * relation.raw_material.unit_price_try), 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ürün Resmi */}
                {selectedProduct.image && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Ürün Resmi</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name}
                        className="w-full h-48 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setShowProductDetail(false)
                  setSelectedProduct(null)
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

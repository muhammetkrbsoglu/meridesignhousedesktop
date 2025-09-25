import React, { useState, useEffect } from 'react'
import supabase from './SupabaseClient'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  isActive: boolean
}

interface RawMaterial {
  id: string
  name: string
  unit_price_try: number | null
  stock_quantity: number | null
  stock_unit: string | null
}

interface ProductRecipe {
  id: string
  product_id: string
  raw_material_id: string | null
  type: 'MATERIAL' | 'LABOR'
  quantity: number | null
  unit: string | null
  option_key: string | null
  notes: string | null
  raw_materials?: {
    name: string
    unit_price_try: number | null
    stock_unit: string | null
  }
  products?: {
    name: string
  }
}

interface PriceRule {
  id: string
  product_id: string
  target_margin_percent: number | null
  auto_pricing_enabled: boolean
  products?: {
    name: string
  }
}

export default function ProductRecipeManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [productRecipes, setProductRecipes] = useState<ProductRecipe[]>([])
  const [priceRules, setPriceRules] = useState<PriceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [showAddPriceRule, setShowAddPriceRule] = useState(false)

  // Form states
  const [newRecipe, setNewRecipe] = useState({
    product_id: '',
    raw_material_id: '',
    type: 'MATERIAL' as 'MATERIAL' | 'LABOR',
    quantity: '',
    unit: '',
    option_key: '',
    notes: ''
  })

  const [newPriceRule, setNewPriceRule] = useState({
    product_id: '',
    target_margin_percent: '',
    auto_pricing_enabled: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadProducts(),
        loadRawMaterials(),
        loadProductRecipes(),
        loadPriceRules()
      ])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const loadRawMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name')

      if (error) throw error
      setRawMaterials(data || [])
    } catch (error) {
      console.error('Yarı mamuller yüklenirken hata:', error)
    }
  }

  const loadProductRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_recipes')
        .select(`
          *,
          raw_materials (name, unit_price_try, stock_unit),
          products (name)
        `)
        .order('product_id')

      if (error) throw error
      setProductRecipes(data || [])
    } catch (error) {
      console.error('Ürün reçeteleri yüklenirken hata:', error)
    }
  }

  const loadPriceRules = async () => {
    try {
      const { data, error } = await supabase
        .from('price_rules')
        .select(`
          *,
          products (name)
        `)
        .order('product_id')

      if (error) throw error
      setPriceRules(data || [])
    } catch (error) {
      console.error('Fiyat kuralları yüklenirken hata:', error)
    }
  }

  const createRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('product_recipes')
        .insert([{
          product_id: newRecipe.product_id,
          raw_material_id: newRecipe.raw_material_id || null,
          type: newRecipe.type,
          quantity: newRecipe.quantity ? Number(newRecipe.quantity) : null,
          unit: newRecipe.unit || null,
          option_key: newRecipe.option_key || null,
          notes: newRecipe.notes || null
        }])

      if (error) throw error

      setShowAddRecipe(false)
      setNewRecipe({
        product_id: '',
        raw_material_id: '',
        type: 'MATERIAL',
        quantity: '',
        unit: '',
        option_key: '',
        notes: ''
      })
      loadProductRecipes()
    } catch (error) {
      console.error('Reçete oluşturulurken hata:', error)
      alert('Reçete oluşturulurken hata oluştu!')
    }
  }

  const createPriceRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('price_rules')
        .insert([{
          product_id: newPriceRule.product_id,
          target_margin_percent: newPriceRule.target_margin_percent ? Number(newPriceRule.target_margin_percent) : null,
          auto_pricing_enabled: newPriceRule.auto_pricing_enabled
        }])

      if (error) throw error

      setShowAddPriceRule(false)
      setNewPriceRule({
        product_id: '',
        target_margin_percent: '',
        auto_pricing_enabled: true
      })
      loadPriceRules()
    } catch (error) {
      console.error('Fiyat kuralı oluşturulurken hata:', error)
      alert('Fiyat kuralı oluşturulurken hata oluştu!')
    }
  }

  const calculateRecipeCost = (recipes: ProductRecipe[]) => {
    return recipes.reduce((total, recipe) => {
      if (recipe.type === 'MATERIAL' && recipe.raw_materials) {
        const materialCost = recipe.raw_materials.unit_price_try || 0
        const quantity = recipe.quantity || 0
        return total + (materialCost * quantity)
      }
      return total
    }, 0)
  }

  const calculateRecipeMargin = (product: Product, recipes: ProductRecipe[]) => {
    const cost = calculateRecipeCost(recipes)
    if (cost === 0) return 0
    return ((product.price - cost) / product.price) * 100
  }

  const filteredRecipes = productRecipes.filter(recipe =>
    selectedProduct === '' || recipe.product_id === selectedProduct
  )

  const filteredPriceRules = priceRules.filter(rule =>
    selectedProduct === '' || rule.product_id === selectedProduct
  )

  const getProductRecipes = (productId: string) => {
    return productRecipes.filter(recipe => recipe.product_id === productId)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ürün & Reçete Yönetimi</h1>
        <div className="flex gap-4">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Tüm Ürünler</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddRecipe(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            + Reçete Ekle
          </button>
          <button
            onClick={() => setShowAddPriceRule(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            + Fiyat Kuralı
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Add Recipe Modal */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Reçete Ekle</h2>
            <form onSubmit={createRecipe}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ürün *</label>
                  <select
                    required
                    value={newRecipe.product_id}
                    onChange={(e) => setNewRecipe({...newRecipe, product_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Ürün seçin</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tip *</label>
                  <select
                    required
                    value={newRecipe.type}
                    onChange={(e) => setNewRecipe({...newRecipe, type: e.target.value as 'MATERIAL' | 'LABOR'})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="MATERIAL">Malzeme</option>
                    <option value="LABOR">İşçilik</option>
                  </select>
                </div>
                {newRecipe.type === 'MATERIAL' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Yarı Mamul *</label>
                    <select
                      required
                      value={newRecipe.raw_material_id}
                      onChange={(e) => setNewRecipe({...newRecipe, raw_material_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Yarı mamul seçin</option>
                      {rawMaterials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Miktar</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRecipe.quantity}
                    onChange={(e) => setNewRecipe({...newRecipe, quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Miktar girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birim</label>
                  <input
                    type="text"
                    value={newRecipe.unit}
                    onChange={(e) => setNewRecipe({...newRecipe, unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Birim (adet, m, gr, vb.)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opsiyon Anahtarı</label>
                  <input
                    type="text"
                    value={newRecipe.option_key}
                    onChange={(e) => setNewRecipe({...newRecipe, option_key: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Örn: renk_kırmızı, beden_m"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notlar</label>
                  <textarea
                    value={newRecipe.notes}
                    onChange={(e) => setNewRecipe({...newRecipe, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Reçete hakkında notlar"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRecipe(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Price Rule Modal */}
      {showAddPriceRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Fiyat Kuralı Ekle</h2>
            <form onSubmit={createPriceRule}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ürün *</label>
                  <select
                    required
                    value={newPriceRule.product_id}
                    onChange={(e) => setNewPriceRule({...newPriceRule, product_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Ürün seçin</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hedef Kar Marjı (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPriceRule.target_margin_percent}
                    onChange={(e) => setNewPriceRule({...newPriceRule, target_margin_percent: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Örn: 40.5"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoPricing"
                    checked={newPriceRule.auto_pricing_enabled}
                    onChange={(e) => setNewPriceRule({...newPriceRule, auto_pricing_enabled: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="autoPricing" className="text-sm">Otomatik fiyatlandırma aktif</label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPriceRule(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products with Recipes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Ürünler</h2>
          <div className="space-y-3">
            {products.map((product) => {
              const recipes = getProductRecipes(product.id)
              const cost = calculateRecipeCost(recipes)
              const margin = calculateRecipeMargin(product, recipes)

              return (
                <div key={product.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">₺{product.price} • Stok: {product.stock}</p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {recipes.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Maliyet: ₺{cost.toFixed(2)}</p>
                      <p className={`text-sm ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                        Kar Marjı: {margin.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">{recipes.length} reçete öğesi</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Henüz reçete yok</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recipes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Reçeteler</h2>
          <div className="space-y-3">
            {filteredRecipes.length === 0 ? (
              <p className="text-gray-500">Reçete bulunamadı</p>
            ) : (
              filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {recipe.products?.name} - {recipe.type === 'MATERIAL' ? 'Malzeme' : 'İşçilik'}
                      </p>
                      {recipe.raw_materials && (
                        <p className="text-sm text-gray-600">{recipe.raw_materials.name}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {recipe.quantity} {recipe.unit}
                        {recipe.option_key && ` • ${recipe.option_key}`}
                      </p>
                      {recipe.notes && (
                        <p className="text-sm text-gray-500 mt-1">{recipe.notes}</p>
                      )}
                    </div>
                    <button className="text-red-500 hover:text-red-700">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Price Rules */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Fiyat Kuralları</h2>
        <div className="space-y-3">
          {filteredPriceRules.length === 0 ? (
            <p className="text-gray-500">Fiyat kuralı bulunamadı</p>
          ) : (
            filteredPriceRules.map((rule) => (
              <div key={rule.id} className="p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{rule.products?.name}</p>
                    <p className="text-sm text-gray-600">
                      Hedef Kar Marjı: {rule.target_margin_percent || 'Belirtilmemiş'}%
                    </p>
                    <p className={`text-sm ${rule.auto_pricing_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {rule.auto_pricing_enabled ? '✅ Otomatik fiyatlandırma aktif' : '❌ Otomatik fiyatlandırma kapalı'}
                    </p>
                  </div>
                  <button className="text-red-500 hover:text-red-700">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
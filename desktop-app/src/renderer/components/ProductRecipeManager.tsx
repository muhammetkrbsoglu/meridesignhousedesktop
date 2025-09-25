import React, { useState, useEffect } from 'react'
import { DatabaseService } from '../services/database'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { ErrorHandler } from '../utils/errorHandler'
import { 
  SpinnerIcon, 
  DeleteIcon, 
  PackageIcon, 
  AlertTriangleIcon 
} from './icons/index'

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  price: number
}

interface RecipeItem {
  id: string
  product_id: string
  raw_material_id: string
  quantity: number
  unit: string
  notes?: string
}

interface RawMaterial {
  id: string
  name: string
  unit_price_try: number
  stock_quantity: number
  stock_unit: string
}

const ProductRecipeManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const db = new DatabaseService()

      // Load products
      const productsData = await db.select('products')
      setProducts(productsData || [])

      // Load recipes
      const recipesData = await db.select('product_recipes')
      setRecipes(recipesData || [])

      // Load raw materials
      const rawMaterialsData = await db.select('raw_materials')
      setRawMaterials(rawMaterialsData || [])

    } catch (error) {
      ErrorHandler.handle(error, 'ProductRecipeManager.loadData')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    try {
      setDeleteLoading(true)
      const db = new DatabaseService()

      // Delete selected products and their recipes
      for (const productId of selectedProducts) {
        // Delete associated recipes first
        const productRecipes = recipes.filter(r => r.product_id === productId)
        for (const recipe of productRecipes) {
          await db.delete('product_recipes', recipe.id)
        }

        // Delete product
        await db.delete('products', productId)
      }

      // Reload data
      await loadData()

      // Clear selection
      setSelectedProducts([])
      setShowDeleteDialog(false)

    } catch (error) {
      ErrorHandler.handle(error, 'ProductRecipeManager.handleBulkDelete')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      const db = new DatabaseService()

      await db.delete('product_recipes', recipeId)

      // Reload data
      await loadData()

    } catch (error) {
      ErrorHandler.handle(error, 'ProductRecipeManager.handleDeleteRecipe')
    }
  }

  const getProductRecipes = (productId: string) => {
    return recipes.filter(recipe => recipe.product_id === productId)
  }

  const getRawMaterialName = (rawMaterialId: string) => {
    const material = rawMaterials.find(rm => rm.id === rawMaterialId)
    return material ? material.name : 'Bilinmiyor'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Ürün & Reçete Yönetimi</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <SpinnerIcon className="animate-spin h-8 w-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ürün & Reçete Yönetimi</h1>

        {selectedProducts.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedProducts.length} ürün seçildi
            </Badge>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <SpinnerIcon className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <DeleteIcon className="h-4 w-4 mr-2" />
              )}
              Toplu Sil
            </Button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Select All Checkbox */}
        <div className="md:col-span-2 lg:col-span-3 flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            checked={selectedProducts.length === products.length && products.length > 0}
            onChange={handleSelectAll}
            className="h-5 w-5 text-blue-600 bg-white border-2 border-blue-300 focus:ring-blue-500 focus:ring-2 rounded cursor-pointer"
          />
          <label className="text-sm font-medium text-blue-900 cursor-pointer">
            Tümünü Seç ({products.length} ürün)
          </label>
        </div>

        {/* Product Cards */}
        {products.map((product) => {
          const productRecipes = getProductRecipes(product.id)
          const isSelected = selectedProducts.includes(product.id)

          return (
            <Card key={product.id} className={`relative transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg' : 'hover:shadow-md'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleProductSelect(product.id)}
                    className="h-5 w-5 text-blue-600 bg-white border-2 border-blue-300 focus:ring-blue-500 focus:ring-2 rounded cursor-pointer"
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stok:</span>
                    <Badge className={product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {product.stock} adet
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fiyat:</span>
                    <span className="font-medium">₺{product.price}</span>
                  </div>

                  {productRecipes.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Reçete ({productRecipes.length} malzeme)</h4>
                      <div className="space-y-1">
                        {productRecipes.slice(0, 3).map((recipe) => (
                          <div key={recipe.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 truncate flex-1">
                              {getRawMaterialName(recipe.raw_material_id)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {recipe.quantity} {recipe.unit}
                              </span>
                              <button
                                onClick={() => handleDeleteRecipe(recipe.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Reçeteyi sil"
                              >
                                <DeleteIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {productRecipes.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{productRecipes.length - 3} malzeme daha
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz ürün yok</h3>
          <p className="mt-1 text-sm text-gray-500">Ürün ve reçete eklemeye başlayın</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Toplu Silme Onayı</h3>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {selectedProducts.length} ürün ve ilgili tüm reçeteleri silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
              >
                İptal
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <SpinnerIcon className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <DeleteIcon className="h-4 w-4 mr-2" />
                )}
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductRecipeManager

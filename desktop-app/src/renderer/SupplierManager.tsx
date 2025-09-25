import React, { useState, useEffect } from 'react'
import supabase from './SupabaseClient'

interface Supplier {
  id: string
  name: string
  contact: string | null
  url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface RawMaterial {
  id: string
  name: string
  stock_quantity: number | null
  min_stock_quantity: number | null
  lead_time_days: number | null
  supplier_id: string | null
}

interface SupplierOrder {
  id: string
  supplier_id: string
  status: string
  items_json: any
  notes: string | null
  created_at: string
  updated_at: string
}

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showOrderSuggestion, setShowOrderSuggestion] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    url: '',
    notes: ''
  })

  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [orderItems, setOrderItems] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadSuppliers(),
        loadMaterials(),
        loadSupplierOrders()
      ])
    } catch (error) {
      console.error('Tedarikçi veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Tedarikçiler yüklenirken hata:', error)
    }
  }

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Malzemeler yüklenirken hata:', error)
    }
  }

  const loadSupplierOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSupplierOrders(data || [])
    } catch (error) {
      console.error('Tedarikçi siparişleri yüklenirken hata:', error)
    }
  }

  const createSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: newSupplier.name,
          contact: newSupplier.contact || null,
          url: newSupplier.url || null,
          notes: newSupplier.notes || null
        }])
        .select()

      if (error) throw error

      setSuppliers([...suppliers, data[0]])
      setShowAddSupplier(false)
      setNewSupplier({ name: '', contact: '', url: '', notes: '' })
    } catch (error) {
      console.error('Tedarikçi oluşturulurken hata:', error)
      alert('Tedarikçi oluşturulurken hata oluştu!')
    }
  }

  const generateOrderSuggestions = () => {
    const suggestions = materials
      .filter(material =>
        material.stock_quantity !== null &&
        material.min_stock_quantity !== null &&
        material.stock_quantity <= material.min_stock_quantity
      )
      .map(material => ({
        material_id: material.id,
        material_name: material.name,
        current_stock: material.stock_quantity,
        min_stock: material.min_stock_quantity,
        suggested_qty: (material.min_stock_quantity || 0) * 2 - (material.stock_quantity || 0)
      }))

    setOrderItems(suggestions)
    setShowOrderSuggestion(true)
  }

  const createSupplierOrder = async () => {
    if (!selectedSupplier || orderItems.length === 0) {
      alert('Tedarikçi seçin ve sipariş öğeleri ekleyin!')
      return
    }

    try {
      const { error } = await supabase
        .from('supplier_orders')
        .insert([{
          supplier_id: selectedSupplier,
          items_json: orderItems,
          status: 'PENDING',
          notes: `Otomatik oluşturuldu - ${new Date().toLocaleDateString('tr-TR')}`
        }])

      if (error) throw error

      alert('Tedarikçi siparişi oluşturuldu!')
      setShowOrderSuggestion(false)
      setSelectedSupplier('')
      setOrderItems([])
      loadSupplierOrders()
    } catch (error) {
      console.error('Tedarikçi siparişi oluşturulurken hata:', error)
      alert('Tedarikçi siparişi oluşturulurken hata oluştu!')
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockMaterials = materials.filter(material =>
    material.stock_quantity !== null &&
    material.min_stock_quantity !== null &&
    material.stock_quantity <= material.min_stock_quantity
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tedarikçi Yönetimi</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tedarikçi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => setShowAddSupplier(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            + Tedarikçi Ekle
          </button>
          <button
            onClick={generateOrderSuggestions}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            🤖 Otomatik Sipariş Öner
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>{lowStockMaterials.length} malzeme</strong> minimum seviyenin altında - sipariş verilmeli!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Tedarikçi Ekle</h2>
            <form onSubmit={createSupplier}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tedarikçi Adı *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Tedarikçi adı girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">İletişim Bilgisi</label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Telefon veya email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Web Sitesi</label>
                  <input
                    type="url"
                    value={newSupplier.url}
                    onChange={(e) => setNewSupplier({...newSupplier, url: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notlar</label>
                  <textarea
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Tedarikçi hakkında notlar"
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
                  onClick={() => setShowAddSupplier(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Suggestion Modal */}
      {showOrderSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Otomatik Sipariş Önerileri</h2>
            <div className="space-y-3 mb-4">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium">{item.material_name}</p>
                    <p className="text-sm text-gray-600">
                      Mevcut: {item.current_stock} → Önerilen: {item.suggested_qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <input
                      type="number"
                      min="0"
                      value={item.suggested_qty}
                      onChange={(e) => {
                        const newItems = [...orderItems]
                        newItems[index].suggested_qty = parseInt(e.target.value)
                        setOrderItems(newItems)
                      }}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tedarikçi Seç *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Tedarikçi seçin</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createSupplierOrder}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Sipariş Oluştur
              </button>
              <button
                onClick={() => setShowOrderSuggestion(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">Tedarikçi bulunamadı</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold mb-2">{supplier.name}</h3>

              <div className="space-y-2 text-sm">
                {supplier.contact && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">İletişim:</span>
                    <span className="font-medium">{supplier.contact}</span>
                  </div>
                )}

                {supplier.url && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Web:</span>
                    <a href={supplier.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {supplier.url}
                    </a>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Malzeme Sayısı:</span>
                  <span className="font-medium">
                    {materials.filter(m => m.supplier_id === supplier.id).length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Son Güncelleme:</span>
                  <span className="font-medium">
                    {new Date(supplier.updated_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>

              {supplier.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  {supplier.notes}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                  Düzenle
                </button>
                <button className="flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                  Sipariş Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Toplam Tedarikçi</h4>
          <p className="text-2xl font-bold text-blue-600">{suppliers.length}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800">Kritik Malzeme</h4>
          <p className="text-2xl font-bold text-red-600">{lowStockMaterials.length}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Aktif Sipariş</h4>
          <p className="text-2xl font-bold text-green-600">
            {supplierOrders.filter(o => o.status === 'PENDING').length}
          </p>
        </div>
      </div>
    </div>
  )
}
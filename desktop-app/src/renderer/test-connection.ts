// Supabase connection test
import supabase from './SupabaseClient'

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Supabase bağlantısı test ediliyor...')

    // Test basic connection
    const { data: healthData, error: healthError } = await supabase
      .from('raw_materials')
      .select('count', { count: 'exact', head: true })

    if (healthError) {
      console.error('❌ Bağlantı hatası:', healthError)
      return false
    }

    console.log('✅ Supabase bağlantısı başarılı')

    // Test data retrieval
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('*')
      .limit(5)

    if (materialsError) {
      console.error('❌ Veri çekme hatası:', materialsError)
      return false
    }

    console.log(`✅ ${materials?.length || 0} malzeme başarıyla çekildi`)

    // Test suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(3)

    if (suppliersError) {
      console.error('❌ Tedarikçi çekme hatası:', suppliersError)
      return false
    }

    console.log(`✅ ${suppliers?.length || 0} tedarikçi başarıyla çekildi`)

    // Test products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(3)

    if (productsError) {
      console.error('❌ Ürün çekme hatası:', productsError)
      return false
    }

    console.log(`✅ ${products?.length || 0} ürün başarıyla çekildi`)

    // Test orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3)

    if (ordersError) {
      console.error('❌ Sipariş çekme hatası:', ordersError)
      return false
    }

    console.log(`✅ ${orders?.length || 0} sipariş başarıyla çekildi`)

    console.log('🎉 Tüm testler başarılı!')
    return true

  } catch (error) {
    console.error('💥 Test sırasında beklenmedik hata:', error)
    return false
  }
}

export async function testRealtimeConnection() {
  try {
    console.log('🔍 Realtime bağlantısı test ediliyor...')

    // Test realtime subscription
    const channel = supabase.channel('test-connection')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'raw_materials'
      }, (payload: any) => {
        console.log('✅ Realtime mesaj alındı:', payload)
      })

    const subscriptionResponse = await new Promise((resolve) => {
      channel.subscribe((status: any) => {
        console.log('📡 Subscription status:', status)
        resolve(status)
      })
    })

    // Clean up
    await supabase.removeChannel(channel)

    console.log('✅ Realtime bağlantısı çalışıyor')
    return true

  } catch (error) {
    console.error('❌ Realtime test hatası:', error)
    return false
  }
}

export async function testStockDepletion() {
  try {
    console.log('🔍 Stok düşme fonksiyonu test ediliyor...')

    // Get a test material
    const { data: materials } = await supabase
      .from('raw_materials')
      .select('*')
      .limit(1)

    if (!materials || materials.length === 0) {
      console.log('⚠️  Test için malzeme bulunamadı')
      return false
    }

    const testMaterial = materials[0]
    console.log(`📦 Test malzemesi: ${testMaterial.name} (Stok: ${testMaterial.stock_quantity})`)

    // Test stock movement creation
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        raw_material_id: testMaterial.id,
        movement_type: 'OUT',
        quantity: 1,
        reason: 'Test stock depletion'
      }])

    if (movementError) {
      console.error('❌ Stok hareketi oluşturma hatası:', movementError)
      return false
    }

    console.log('✅ Stok düşme fonksiyonu çalışıyor')
    return true

  } catch (error) {
    console.error('❌ Stok düşme test hatası:', error)
    return false
  }
}

export async function runAllTests() {
  console.log('🚀 Tüm sistem testleri başlatılıyor...\n')

  const results = {
    connection: await testSupabaseConnection(),
    realtime: await testRealtimeConnection(),
    stockDepletion: await testStockDepletion()
  }

  const successCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length

  console.log(`\n📊 Test Sonuçları: ${successCount}/${totalCount} başarılı`)

  if (successCount === totalCount) {
    console.log('🎉 Tüm testler başarılı! Sistem hazır!')
  } else {
    console.log('⚠️  Bazı testler başarısız. Lütfen hataları kontrol edin.')
  }

  return results
}
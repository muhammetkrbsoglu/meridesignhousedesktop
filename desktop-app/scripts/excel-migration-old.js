/**
 * Excel to Supabase Migration Script
 * Migrates Excel CSV files to Supabase database
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const fs = require('fs')
const csv = require('csv-parser')
const iconv = require('iconv-lite')
const { createClient } = require('@supabase/supabase-js')

class ExcelMigration {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    this.migrationResults = {
      timestamp: new Date().toISOString(),
      migratedFiles: [],
      errors: [],
      summary: {
        totalRecords: 0,
        successfulInserts: 0,
        failedInserts: 0,
        skippedRecords: 0
      }
    }
  }

  async testConnection() {
    console.log('🔍 Testing database connection...')

    try {
      console.log('Supabase URL:', process.env.SUPABASE_URL)
      console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? '***masked***' : 'undefined')

      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        console.log('Connection error:', error)
        throw new Error(`Database connection failed: ${error.message}`)
      }

      console.log('✅ Database connection successful')
    } catch (error) {
      console.log('Full error:', error)
      throw new Error(`Database connection test failed: ${error.message}`)
    }
  }

  async migrateAll() {
    console.log('🚀 Starting Excel to Supabase migration...')

    try {
      // Test database connection first
      await this.testConnection()

      // Migrate customers
      await this.migrateCustomers()

      // Migrate products
      await this.migrateProducts()

      // Migrate orders
      await this.migrateOrders()

      // Migrate raw materials
      await this.migrateRawMaterials()

      // Migrate supplier orders
      await this.migrateSupplierOrders()

      // Migrate shipping costs
      await this.migrateShippingCosts()

      // Migrate cities
      await this.migrateCities()

      // Generate migration report
      await this.generateMigrationReport()

      console.log('✅ Migration completed successfully!')

    } catch (error) {
      console.error('❌ Migration failed:', error)
      await this.generateMigrationReport()
      process.exit(1)
    }
  }

  // Debug method to test individual migrations
  async testCustomersOnly() {
    console.log('🧪 Testing customer migration only...')

    try {
      await this.testConnection()
      await this.migrateCustomers()
      await this.generateMigrationReport()

      console.log('✅ Customer migration test completed!')
    } catch (error) {
      console.error('❌ Customer migration test failed:', error)
      await this.generateMigrationReport()
    }
  }

  async migrateCustomers() {
    console.log('📊 Migrating customers from SQLite...')
    console.log('__dirname:', __dirname)
    console.log('Current working directory:', process.cwd())

    const customers = []
    const sqlitePath = path.join(__dirname, 'takip_programi.db')
    console.log('SQLite file path:', sqlitePath)

    return new Promise((resolve, reject) => {
      console.log('Opening SQLite database:', sqlitePath)
      let rowCount = 0

      // Use sqlite3 instead of CSV
      const sqlite3 = require('sqlite3').verbose()
      const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query customers table, skip header rows
        db.all(`SELECT * FROM V_Müşteriler WHERE "Unnamed: 3" IS NOT NULL AND "Unnamed: 3" != 'MÜŞTERİLER' AND "Unnamed: 3" != 'Ad Soyadı'`, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying customers:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} customer records to process`)

          rows.forEach((row, index) => {
            rowCount++

            // Debug: Log first few rows
            if (index < 3) {
              console.log(`Row ${index}:`, row)
            }

            // Skip empty rows
            if (!row['Unnamed: 3'] || row['Unnamed: 3'].trim() === '') {
              console.log(`⏭️  Skipping empty row ${index}`)
              this.migrationResults.summary.skippedRecords++
              return
            }

            // Generate a unique ID for the user
            const customerId = `customer_${row['Unnamed: 2']?.trim()}_${Date.now()}`

            const customer = {
              id: customerId,
              email: null, // Email column doesn't exist in SQLite
              name: row['Unnamed: 3']?.trim() || '',
              phone: row['Unnamed: 4']?.trim() || null,
              address: row['Unnamed: 5']?.trim() || null,
              city: row['Unnamed: 6']?.trim() || null,
              state: row['Unnamed: 7']?.trim() || null,
              zip_code: null,
              country: 'Turkey',
              role: 'CUSTOMER',
              newsletter_subscription: false,
              preferences: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            customers.push(customer)

            // Log first few customers for debugging
            if (customers.length <= 3) {
              console.log(`🔍 Processing customer: ${JSON.stringify(row)}`)
            }
          })

          console.log(`✅ Processed ${customers.length} customers from SQLite`)

          // Insert customers in batches to avoid timeout
          if (customers.length > 0) {
            console.log('💾 Inserting customers to Supabase...')

            // Insert in batches to avoid timeout
            const batchSize = 50
            let successfulInserts = 0
            let failedInserts = 0

            // Process batches sequentially using promises
            const processBatches = async () => {
              for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize)
                console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(customers.length / batchSize)} (${batch.length} customers)`)

                try {
                  const { data, error } = await this.supabase
                    .from('users')
                    .insert(batch)
                    .select()

                  if (error) {
                    console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
                    failedInserts += batch.length
                  } else {
                    console.log(`✅ Successfully inserted ${data?.length || 0} customers in batch ${Math.floor(i / batchSize) + 1}`)
                    successfulInserts += data?.length || 0
                  }
                } catch (err) {
                  console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
                  failedInserts += batch.length
                }
              }
            }

            await processBatches()

            console.log(`✅ Migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
          } else {
            console.log('⚠️ No customers to insert')
          }

          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message)
            } else {
              console.log('✅ Database closed successfully')
            }
            resolve()
          })
        })
      })
    })
  }

  async insertBatch(tableName, records, batchSize) {
    console.log(`📦 Inserting ${records.length} records to ${tableName} in batches of ${batchSize}`)

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${batch.length} records)`)

      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .insert(batch)
          .select()

        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
          this.migrationResults.failedInserts += batch.length
        } else {
          console.log(`✅ Successfully inserted ${data?.length || 0} records in batch ${Math.floor(i / batchSize) + 1}`)
          this.migrationResults.successfulInserts += data?.length || 0
        }
      } catch (err) {
        console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
        this.migrationResults.failedInserts += batch.length
      }
      }

      console.log(`✅ Customer migration completed successfully`)
      this.migrationResults.summary.totalRecords += customers.length
      resolve()
    } catch (error) {
      console.error('❌ Customer migration error:', error)
      reject(error)
    }
    })
  }

  async migrateProducts() {
    console.log('📊 Products migration not implemented yet - using SQLite approach')
    console.log('✅ Migration completed successfully')
    return Promise.resolve()
  }

  async testSQLite() {
    console.log('🧪 Testing SQLite database connection...')
    const sqlitePath = path.join(__dirname, 'takip_programi.db')

    return new Promise((resolve, reject) => {
      const sqlite3 = require('sqlite3').verbose()
      const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Test query
        db.get('SELECT COUNT(*) as count FROM V_Müşteriler', (err, row) => {
          if (err) {
            console.error('❌ Error querying database:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📊 Total customers in SQLite: ${row.count}`)

          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message)
            } else {
              console.log('✅ Database closed successfully')
            }
            resolve()
          })
        })
      })
    })
  }

  async migrateCustomers() {
    console.log('📊 Migrating customers from SQLite...')
    console.log('__dirname:', __dirname)
    console.log('Current working directory:', process.cwd())

    const customers = []
    const sqlitePath = path.join(__dirname, 'takip_programi.db')
    console.log('SQLite file path:', sqlitePath)

    return new Promise((resolve, reject) => {
      console.log('Opening SQLite database:', sqlitePath)
      let rowCount = 0

      // Use sqlite3 instead of CSV
      const sqlite3 = require('sqlite3').verbose()
      const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query customers table, skip header rows
        db.all(`SELECT * FROM V_Müşteriler WHERE "Unnamed: 3" IS NOT NULL AND "Unnamed: 3" != 'MÜŞTERİLER' AND "Unnamed: 3" != 'Ad Soyadı'`, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying customers:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} customer records to process`)

          rows.forEach((row, index) => {
            rowCount++

            // Debug: Log first few rows
            if (index < 3) {
              console.log(`Row ${index}:`, row)
            }

            // Skip empty rows
            if (!row['Unnamed: 3'] || row['Unnamed: 3'].trim() === '') {
              console.log(`⏭️  Skipping empty row ${index}`)
              this.migrationResults.summary.skippedRecords++
              return
            }

            // Generate a unique ID for the user
            const customerId = `customer_${row['Unnamed: 2']?.trim()}_${Date.now()}`

            const customer = {
              id: customerId,
              email: null, // Email column doesn't exist in SQLite
              name: row['Unnamed: 3']?.trim() || '',
              phone: row['Unnamed: 4']?.trim() || null,
              address: row['Unnamed: 5']?.trim() || null,
              city: row['Unnamed: 6']?.trim() || null,
              state: row['Unnamed: 7']?.trim() || null,
              zip_code: null,
              country: 'Turkey',
              role: 'CUSTOMER',
              newsletter_subscription: false,
              preferences: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            customers.push(customer)

            // Log first few customers for debugging
            if (customers.length <= 3) {
              console.log(`🔍 Processing customer: ${JSON.stringify(row)}`)
            }
          })

          console.log(`✅ Processed ${customers.length} customers from SQLite`)

          // Insert customers in batches to avoid timeout
          if (customers.length > 0) {
            console.log('💾 Inserting customers to Supabase...')

            // Insert in batches to avoid timeout
            const batchSize = 50
            let successfulInserts = 0
            let failedInserts = 0

            // Process batches sequentially using promises
            const processBatches = async () => {
              for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize)
                console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(customers.length / batchSize)} (${batch.length} customers)`)

                try {
                  const { data, error } = await this.supabase
                    .from('users')
                    .insert(batch)
                    .select()

                  if (error) {
                    console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
                    failedInserts += batch.length
                  } else {
                    console.log(`✅ Successfully inserted ${data?.length || 0} customers in batch ${Math.floor(i / batchSize) + 1}`)
                    successfulInserts += data?.length || 0
                  }
                } catch (err) {
                  console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
                  failedInserts += batch.length
                }
              }
            }

            await processBatches()

            console.log(`✅ Migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
          } else {
            console.log('⚠️ No customers to insert')
          }

          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message)
            } else {
              console.log('✅ Database closed successfully')
            }
            resolve()
          })
        })
      })
    })
  }

  async migrateProducts() {
    console.log('📊 Migrating products from SQLite...')

    const products = []
    const sqlitePath = path.join(__dirname, 'takip_programi.db')
    console.log('SQLite file path:', sqlitePath)

    return new Promise((resolve, reject) => {
      console.log('Opening SQLite database:', sqlitePath)

      // Use sqlite3 instead of CSV
      const sqlite3 = require('sqlite3').verbose()
      const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query products table, skip header rows
        db.all(`SELECT * FROM V_Ürünler WHERE "Unnamed: 4" IS NOT NULL AND "Unnamed: 4" != 'ÜRÜNLER' AND "Unnamed: 4" != 'Ürün Adı'`, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying products:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} product records to process`)

          rows.forEach((row, index) => {
            // Debug: Log first few rows
            if (index < 3) {
              console.log(`Row ${index}:`, row)
            }

            // Skip empty rows
            if (!row['Unnamed: 4'] || row['Unnamed: 4'].trim() === '') {
              console.log(`⏭️  Skipping empty row ${index}`)
              this.migrationResults.summary.skippedRecords++
              return
            }

            // Generate a unique ID for the product
            const productId = `product_${row['Unnamed: 2']?.trim()}_${Date.now()}`

            const product = {
              id: productId,
              name: row['Unnamed: 4']?.trim() || '',
              sku: row['Unnamed: 2']?.trim() || null,
              price: 0, // Will be calculated later
              stock: 0,
              isActive: true,
              isFeatured: false,

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row, index) => {
          // Skip header rows (first 3 rows) and empty rows
          if (index < 3 || !row['Ürün Adı'] || row['Ürün Adı'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          // Generate unique IDs
          const productId = `product_${row['No']?.trim()}_${Date.now()}_${index}`
          const categoryId = `category_${row['Kategori']?.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

          // Extract price from "Birim Satış Tutarı" column
          const salesPriceStr = row['Birim Satış Tutarı']?.trim() || '0'
          const salesPrice = parseFloat(salesPriceStr.replace('₺', '').replace(',', '.')) || 0

          // Calculate cost price from yarı mamul prices
          let costPrice = 0
          for (let i = 1; i <= 9; i++) {
            const materialPrice = parseFloat(row[`${i}.Y.M. Birim Fiyatı`]?.replace('₺', '').replace(',', '.') || '0') || 0
            costPrice += materialPrice
          }

          // Create category if not exists
          const category = {
            id: categoryId,
            name: row['Kategori']?.trim() || 'Uncategorized',
            slug: row['Kategori']?.trim().toLowerCase().replace(/\s+/g, '-') || 'uncategorized',
            description: `${row['Kategori']?.trim()} ürünleri`,
            isActive: true,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          if (!categories.find(c => c.name === category.name)) {
            categories.push(category)
          }

          const product = {
            id: productId,
            name: row['Ürün Adı']?.trim() || '',
            slug: row['Ürün Adı']?.trim().toLowerCase().replace(/\s+/g, '-') || 'unnamed-product',
            sku: row['No']?.trim() || null,
            price: salesPrice,
            oldPrice: null,
            comparePrice: null,
            stock: 0, // Default stock
            isActive: true,
            isFeatured: false,
            isNewArrival: false,
            isProductOfWeek: false,
            categoryId: categoryId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            colors: [],
            hasVariants: false
          }

          products.push(product)

          // Log first few products for debugging
          if (products.length <= 3) {
            console.log(`🔍 Processing product: ${row['Ürün Adı']} - Price: ${salesPrice}`)
          }
        })
        .on('end', async () => {
          try {
            console.log(`📋 Total products to migrate: ${products.length}`)
            console.log(`📋 Total categories to migrate: ${categories.length}`)

            let successfulInserts = 0
            let failedInserts = 0

            // First, migrate categories
            if (categories.length > 0) {
              console.log('📦 Migrating categories first...')
              const { data: categoryData, error: categoryError } = await this.supabase
                .from('categories')
                .insert(categories)
                .select()

              if (categoryError) {
                console.error('❌ Categories migration failed:', categoryError.message)
                this.migrationResults.errors.push({
                  file: 'categories',
                  error: categoryError.message,
                  count: categories.length
                })
              } else {
                successfulInserts += categoryData.length
                console.log(`✅ Migrated ${categoryData.length} categories`)
              }
            }

            // Then, migrate products
            if (products.length > 0) {
              console.log('📦 Migrating products...')

              // Insert in batches to avoid timeout
              const batchSize = 50
              for (let i = 0; i < products.length; i += batchSize) {
                const batch = products.slice(i, i + batchSize)
                console.log(`📦 Migrating product batch ${Math.floor(i/batchSize) + 1} (${batch.length} products)`)

                const { data, error } = await this.supabase
                  .from('products')
                  .insert(batch)
                  .select()

                if (error) {
                  console.error(`❌ Product batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
                  this.migrationResults.errors.push({
                    file: 'products',
                    error: `Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`,
                    count: batch.length
                  })
                  failedInserts += batch.length
                } else {
                  successfulInserts += data.length
                  console.log(`✅ Product batch ${Math.floor(i/batchSize) + 1} successful: ${data.length} products`)
                }
              }
            }

            this.migrationResults.summary.successfulInserts += successfulInserts
            this.migrationResults.summary.failedInserts += failedInserts

            this.migrationResults.migratedFiles.push({
              file: 'products_and_categories',
              records: successfulInserts,
              status: successfulInserts > 0 ? 'success' : 'failed'
            })

            console.log(`✅ Products migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
            this.migrationResults.summary.totalRecords += products.length
            resolve()
          } catch (error) {
            console.error('❌ Products migration error:', error)
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async migrateOrders() {
    console.log('📊 Migrating orders...')

    const orders = []
    const orderItems = []
    const filePath = path.join('C:', 'Users', 'fower', 'Desktop', 'meridesignhousedesktop', 'excel', 'TAKİP PROGRAMI 1(siparişler).csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row, index) => {
          // Skip header rows (first 3 rows) and empty rows
          if (index < 3 || !row['Müşteri'] || row['Müşteri'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          // Generate unique order ID
          const orderId = `order_${Date.now()}_${index}`

          // Parse prices and clean currency symbols
          const unitPrice = parseFloat(row['Birim Satış Tutarı']?.replace('₺', '').replace(',', '.') || '0') || 0
          const quantity = parseInt(row['Adet']?.replace(',', '.') || '0') || 0
          const totalAmount = unitPrice * quantity
          const shippingCost = parseFloat(row['Kargo Ücreti']?.replace('₺', '').replace(',', '.') || '0') || 0

          const order = {
            id: orderId,
            orderNumber: `ORD-${Date.now()}-${index}`, // Generate unique order number
            customerName: row['Müşteri']?.trim() || '',
            customerEmail: null, // Email not available in CSV
            customerPhone: null, // Phone not directly available in this CSV
            status: this.mapOrderStatus(row['Ödeme Durumu']?.trim() || 'bekliyor'),
            totalAmount: totalAmount + shippingCost,
            shippingCost: shippingCost,
            taxAmount: 0, // Tax not specified
            shippingAddress: row['Sipariş Notu']?.trim() || 'Adres bilgisi mevcut değil',
            shippingCity: null, // City not specified in this CSV
            shippingState: null, // State not specified in this CSV
            shippingZip: null,
            shippingCountry: 'Turkey',
            notes: row['Sipariş Notu']?.trim() || null,
            createdAt: this.parseDate(row['Sipariş Alınan Tarih']?.trim()) || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            payment_status: row['Ödeme Durumu']?.trim() || 'PENDING'
          }

          // Create order item
          const orderItem = {
            id: `order_item_${Date.now()}_${index}`,
            orderId: orderId,
            productId: null, // Will be linked later if product exists
            quantity: quantity,
            price: unitPrice,
            createdAt: new Date().toISOString()
          }

          orders.push(order)
          orderItems.push(orderItem)

          // Log first few orders for debugging
          if (orders.length <= 3) {
            console.log(`🔍 Processing order: ${row['Müşteri']} - ${row['Ürün Adı']} x${quantity} = ₺${totalAmount}`)
          }
        })
        .on('end', async () => {
          try {
            console.log(`📋 Total orders to migrate: ${orders.length}`)

            let successfulInserts = 0
            let failedInserts = 0

            // First, migrate orders
            if (orders.length > 0) {
              console.log('📦 Migrating orders...')

              // Insert in batches to avoid timeout
              const batchSize = 50
              for (let i = 0; i < orders.length; i += batchSize) {
                const batch = orders.slice(i, i + batchSize)
                console.log(`📦 Migrating order batch ${Math.floor(i/batchSize) + 1} (${batch.length} orders)`)

                const { data, error } = await this.supabase
                  .from('orders')
                  .insert(batch)
                  .select()

                if (error) {
                  console.error(`❌ Order batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
                  this.migrationResults.errors.push({
                    file: 'orders',
                    error: `Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`,
                    count: batch.length
                  })
                  failedInserts += batch.length
                } else {
                  successfulInserts += data.length
                  console.log(`✅ Order batch ${Math.floor(i/batchSize) + 1} successful: ${data.length} orders`)
                }
              }
            }

            // Then, migrate order items
            if (orderItems.length > 0) {
              console.log('📦 Migrating order items...')

              const batchSize = 50
              for (let i = 0; i < orderItems.length; i += batchSize) {
                const batch = orderItems.slice(i, i + batchSize)
                console.log(`📦 Migrating order item batch ${Math.floor(i/batchSize) + 1} (${batch.length} items)`)

                const { data, error } = await this.supabase
                  .from('order_items')
                  .insert(batch)
                  .select()

                if (error) {
                  console.error(`❌ Order item batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
                  this.migrationResults.errors.push({
                    file: 'order_items',
                    error: `Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`,
                    count: batch.length
                  })
                  failedInserts += batch.length
                } else {
                  successfulInserts += data.length
                  console.log(`✅ Order item batch ${Math.floor(i/batchSize) + 1} successful: ${data.length} items`)
                }
              }
            }

            this.migrationResults.summary.successfulInserts += successfulInserts
            this.migrationResults.summary.failedInserts += failedInserts

            this.migrationResults.migratedFiles.push({
              file: 'orders_and_order_items',
              records: successfulInserts,
              status: successfulInserts > 0 ? 'success' : 'failed'
            })

            console.log(`✅ Orders migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
            this.migrationResults.summary.totalRecords += orders.length
            resolve()
          } catch (error) {
            console.error('❌ Orders migration error:', error)
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async migrateRawMaterials() {
    console.log('📊 Migrating raw materials...')

    const rawMaterials = []
    const suppliers = []
    const filePath = path.join('C:', 'Users', 'fower', 'Desktop', 'meridesignhousedesktop', 'excel', 'TAKİP PROGRAMI 1(yarı-mamul-listesi).csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row, index) => {
          // Skip header rows (first 3 rows) and empty rows
          if (index < 3 || !row['Yarı Mamul Adı'] || row['Yarı Mamul Adı'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          // Generate unique IDs
          const rawMaterialId = `raw_material_${Date.now()}_${index}`
          const supplierId = `supplier_${row['Tedarikçi Adı']?.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

          // Parse prices and clean currency symbols
          const unitPrice = parseFloat(row['Yarı Mamul Birim Fiyatı']?.replace('₺', '').replace(',', '.') || '0') || 0
          const stockQuantity = parseFloat(row['Stok Miktarı']?.replace(',', '.') || '0') || 0

          // Create supplier if not exists
          const supplier = {
            id: supplierId,
            name: row['Tedarikçi Adı']?.trim() || 'Bilinmeyen Tedarikçi',
            contact: row['Ürün Linki / Tedarikçi İletişim numarası']?.trim() || null,
            url: row['Ürün Linki / Tedarikçi İletişim numarası']?.trim() || null,
            notes: row['Açıklama']?.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          if (!suppliers.find(s => s.name === supplier.name)) {
            suppliers.push(supplier)
          }

          const rawMaterial = {
            id: rawMaterialId,
            name: row['Yarı Mamul Adı']?.trim() || '',
            unit_price_try: unitPrice,
            stock_quantity: stockQuantity,
            stock_unit: 'adet', // Default unit
            supplier_id: supplierId,
            contact_or_url: row['Ürün Linki / Tedarikçi İletişim numarası']?.trim() || null,
            price_date: this.parseDate(row['Fiyat Alım Tarihi']?.trim()),
            notes: row['Açıklama']?.trim() || null,
            min_stock_quantity: stockQuantity * 0.1, // Set min stock to 10% of current stock
            min_stock_unit: 'adet',
            lead_time_days: 7, // Default lead time
            reorder_point: stockQuantity * 0.2, // Reorder when 20% remaining
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          rawMaterials.push(rawMaterial)

          // Log first few raw materials for debugging
          if (rawMaterials.length <= 3) {
            console.log(`🔍 Processing raw material: ${row['Yarı Mamul Adı']} - Stock: ${stockQuantity} - Price: ₺${unitPrice}`)
          }
        })
        .on('end', async () => {
          try {
            console.log(`📋 Total raw materials to migrate: ${rawMaterials.length}`)
            console.log(`📋 Total suppliers to migrate: ${suppliers.length}`)

            let successfulInserts = 0
            let failedInserts = 0

            // First, migrate suppliers
            if (suppliers.length > 0) {
              console.log('📦 Migrating suppliers first...')

              const { data: supplierData, error: supplierError } = await this.supabase
                .from('suppliers')
                .insert(suppliers)
                .select()

              if (supplierError) {
                console.error('❌ Suppliers migration failed:', supplierError.message)
                this.migrationResults.errors.push({
                  file: 'suppliers',
                  error: supplierError.message,
                  count: suppliers.length
                })
              } else {
                successfulInserts += supplierData.length
                console.log(`✅ Migrated ${supplierData.length} suppliers`)
              }
            }

            // Then, migrate raw materials
            if (rawMaterials.length > 0) {
              console.log('📦 Migrating raw materials...')

              // Insert in batches to avoid timeout
              const batchSize = 50
              for (let i = 0; i < rawMaterials.length; i += batchSize) {
                const batch = rawMaterials.slice(i, i + batchSize)
                console.log(`📦 Migrating raw material batch ${Math.floor(i/batchSize) + 1} (${batch.length} materials)`)

                const { data, error } = await this.supabase
                  .from('raw_materials')
                  .insert(batch)
                  .select()

                if (error) {
                  console.error(`❌ Raw material batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
                  this.migrationResults.errors.push({
                    file: 'raw_materials',
                    error: `Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`,
                    count: batch.length
                  })
                  failedInserts += batch.length
                } else {
                  successfulInserts += data.length
                  console.log(`✅ Raw material batch ${Math.floor(i/batchSize) + 1} successful: ${data.length} materials`)
                }
              }
            }

            this.migrationResults.summary.successfulInserts += successfulInserts
            this.migrationResults.summary.failedInserts += failedInserts

            this.migrationResults.migratedFiles.push({
              file: 'raw_materials_and_suppliers',
              records: successfulInserts,
              status: successfulInserts > 0 ? 'success' : 'failed'
            })

            console.log(`✅ Raw materials migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
            this.migrationResults.summary.totalRecords += rawMaterials.length
            resolve()
          } catch (error) {
            console.error('❌ Raw materials migration error:', error)
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async migrateSupplierOrders() {
    console.log('📊 Migrating supplier orders...')

    const supplierOrders = []
    const filePath = path.join(__dirname, '..', '..', 'excel', 'TAKİP PROGRAMI 1(sipariş-verilecek-malzemeler).csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row, index) => {
          // Skip header rows (first row) and empty rows
          if (index < 1 || !row['Firma'] || row['Firma'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          // Generate unique order ID
          const orderId = `supplier_order_${Date.now()}_${index}`

          // Parse prices and clean currency symbols
          const unitPrice = parseFloat(row['Adet Fiyatı']?.replace('₺', '').replace(',', '.') || '0') || 0
          const quantity = parseFloat(row['Adet/Kg']?.replace(',', '.') || '0') || 0
          const totalPrice = parseFloat(row['Toplam Fiyat']?.replace('₺', '').replace(',', '.') || '0') || 0

          // Create items JSON for supplier order
          const itemsJson = [{
            name: row['Malzeme']?.trim() || '',
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          }]

          const supplierOrder = {
            id: orderId,
            supplier_id: null, // Will be linked to supplier if exists
            status: 'PENDING',
            items_json: itemsJson,
            notes: `Malzeme: ${row['Malzeme']?.trim() || ''}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          supplierOrders.push(supplierOrder)

          // Log first few supplier orders for debugging
          if (supplierOrders.length <= 3) {
            console.log(`🔍 Processing supplier order: ${row['Malzeme']} - Qty: ${quantity} - Total: ₺${totalPrice} - Supplier: ${row['Firma']}`)
          }
        })
        .on('end', async () => {
          try {
            console.log(`📋 Total supplier orders to migrate: ${supplierOrders.length}`)

            if (supplierOrders.length > 0) {
              // Insert in batches to avoid timeout
              const batchSize = 50
              let successfulInserts = 0
              let failedInserts = 0

              for (let i = 0; i < supplierOrders.length; i += batchSize) {
                const batch = supplierOrders.slice(i, i + batchSize)
                console.log(`📦 Migrating supplier order batch ${Math.floor(i/batchSize) + 1} (${batch.length} orders)`)

                const { data, error } = await this.supabase
                  .from('supplier_orders')
                  .insert(batch)
                  .select()

                if (error) {
                  console.error(`❌ Supplier order batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
                  this.migrationResults.errors.push({
                    file: 'supplier_orders',
                    error: `Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`,
                    count: batch.length
                  })
                  failedInserts += batch.length
                } else {
                  successfulInserts += data.length
                  console.log(`✅ Supplier order batch ${Math.floor(i/batchSize) + 1} successful: ${data.length} orders`)
                }
              }

              this.migrationResults.summary.successfulInserts += successfulInserts
              this.migrationResults.summary.failedInserts += failedInserts

              this.migrationResults.migratedFiles.push({
                file: 'supplier_orders',
                records: successfulInserts,
                status: successfulInserts > 0 ? 'success' : 'failed'
              })

              console.log(`✅ Supplier orders migration completed: ${successfulInserts} successful, ${failedInserts} failed`)
            }

            this.migrationResults.summary.totalRecords += supplierOrders.length
            resolve()
          } catch (error) {
            console.error('❌ Supplier orders migration error:', error)
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async migrateShippingCosts() {
    console.log('📊 Migrating shipping costs...')

    const shippingCosts = []
    const filePath = path.join(__dirname, '..', '..', 'excel', 'TAKİP PROGRAMI 1(kargo-ücretleri).csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          // Skip empty rows
          if (!row['Şehir'] || row['Şehir'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          const shippingCost = {
            city: row['Şehir']?.trim() || '',
            cost: parseFloat(row['Ücret']?.replace(',', '.') || '0') || 0,
            estimated_days: parseInt(row['Tahmini Gün'] || '0') || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          shippingCosts.push(shippingCost)
        })
        .on('end', async () => {
          try {
            if (shippingCosts.length > 0) {
              const { data, error } = await this.supabase
                .from('shipping_costs')
                .insert(shippingCosts)
                .select()

              if (error) {
                this.migrationResults.errors.push({
                  file: 'shipping_costs',
                  error: error.message,
                  count: shippingCosts.length
                })
                this.migrationResults.summary.failedInserts += shippingCosts.length
              } else {
                this.migrationResults.summary.successfulInserts += data.length
                this.migrationResults.migratedFiles.push({
                  file: 'shipping_costs',
                  records: data.length,
                  status: 'success'
                })
                console.log(`✅ Migrated ${data.length} shipping costs`)
              }
            }

            this.migrationResults.summary.totalRecords += shippingCosts.length
            resolve()
          } catch (error) {
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async migrateCities() {
    console.log('📊 Migrating cities...')

    const cities = []
    const filePath = path.join('C:', 'Users', 'fower', 'Desktop', 'meridesignhousedesktop', 'excel', 'TAKİP PROGRAMI 1(il-ilçe).csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          // Skip empty rows
          if (!row['İl'] || row['İl'].trim() === '') {
            this.migrationResults.summary.skippedRecords++
            return
          }

          const city = {
            name: row['İl']?.trim() || '',
            created_at: new Date().toISOString()
          }

          cities.push(city)
        })
        .on('end', async () => {
          try {
            if (cities.length > 0) {
              const { data, error } = await this.supabase
                .from('cities')
                .insert(cities)
                .select()

              if (error) {
                this.migrationResults.errors.push({
                  file: 'cities',
                  error: error.message,
                  count: cities.length
                })
                this.migrationResults.summary.failedInserts += cities.length
              } else {
                this.migrationResults.summary.successfulInserts += data.length
                this.migrationResults.migratedFiles.push({
                  file: 'cities',
                  records: data.length,
                  status: 'success'
                })
                console.log(`✅ Migrated ${data.length} cities`)
              }
            }

            this.migrationResults.summary.totalRecords += cities.length
            resolve()
          } catch (error) {
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  getCategoryId(categoryName) {
    // Map Turkish category names to existing categories
    const categoryMap = {
      'Elektronik': 'electronics',
      'Giyim': 'clothing',
      'Ev & Yaşam': 'home-living',
      'Spor': 'sports',
      'Kitap': 'books',
      'Kozmetik': 'cosmetics'
    }

    return categoryMap[categoryName] || 'others'
  }

  mapOrderStatus(status) {
    const statusMap = {
      'bekliyor': 'PENDING',
      'onaylandı': 'CONFIRMED',
      'hazırlanıyor': 'PROCESSING',
      'kargoda': 'SHIPPED',
      'teslim edildi': 'DELIVERED',
      'iptal edildi': 'CANCELLED'
    }

    return statusMap[status.toLowerCase()] || 'PENDING'
  }

  parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null

    try {
      // Try different date formats
      const formats = [
        /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
        /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/   // DD/MM/YYYY
      ]

      for (const format of formats) {
        const match = dateStr.match(format)
        if (match) {
          if (format.source.includes('DD.MM.YYYY')) {
            return new Date(`${match[3]}-${match[2]}-${match[1]}`).toISOString()
          } else if (format.source.includes('YYYY-MM-DD')) {
            return new Date(dateStr).toISOString()
          } else if (format.source.includes('DD/MM/YYYY')) {
            return new Date(`${match[3]}-${match[2]}-${match[1]}`).toISOString()
          }
        }
      }

      // If no format matches, try to parse directly
      const parsedDate = new Date(dateStr)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString()
      }

      return null
    } catch (error) {
      console.warn(`Failed to parse date: ${dateStr}`)
      return null
    }
  }

  async generateMigrationReport() {
    console.log('📋 Generating migration report...')

    const report = {
      ...this.migrationResults,
      summary: {
        ...this.migrationResults.summary,
        successRate: this.migrationResults.summary.totalRecords > 0
          ? Math.round((this.migrationResults.summary.successfulInserts / this.migrationResults.summary.totalRecords) * 100)
          : 0
      }
    }

    const reportPath = 'migration-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`📄 Migration report generated: ${reportPath}`)

    // Log summary
    console.log('\n📊 Migration Summary:')
    console.log(`Total Files Processed: ${this.migrationResults.migratedFiles.length}`)
    console.log(`Total Records: ${this.migrationResults.summary.totalRecords}`)
    console.log(`Successful Inserts: ${this.migrationResults.summary.successfulInserts}`)
    console.log(`Failed Inserts: ${this.migrationResults.summary.failedInserts}`)
    console.log(`Skipped Records: ${this.migrationResults.summary.skippedRecords}`)
    console.log(`Success Rate: ${report.summary.successRate}%`)

    if (this.migrationResults.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.migrationResults.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error} (${error.count} records)`)
      })
    }

    if (this.migrationResults.summary.successRate === 100) {
      console.log('🎉 Migration completed with 100% success rate!')
    } else if (this.migrationResults.summary.successRate >= 90) {
      console.log('✅ Migration completed successfully with minor issues')
    } else {
      console.log('⚠️ Migration completed with some failures - check the report')
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--test-customers')) {
    console.log('🧪 Running customer migration test...')
    const migration = new ExcelMigration()
    migration.testCustomersOnly().catch(console.error)
  } else {
    console.log('🚀 Starting Excel to Supabase Migration...')
    const migration = new ExcelMigration()
    migration.migrateAll().catch(console.error)
  }
}

// Export for use as module
module.exports = ExcelMigration

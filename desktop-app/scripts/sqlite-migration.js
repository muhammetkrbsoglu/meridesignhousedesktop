#!/usr/bin/env node

/**
 * SQLite Database Migration Script
 * Migrates data from SQLite database to Supabase
 *
 * Author: Code Assistant
 * Date: 2025-01-01
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { createClient } = require('@supabase/supabase-js')

class SQLiteMigration {
  constructor() {
    this.sqlitePath = path.join(__dirname, '..', 'takip_programi.db')

    // Supabase Configuration
    this.supabaseUrl = process.env.SUPABASE_URL
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey)

    this.migrationResults = {
      summary: {
        totalRecords: 0,
        successfulInserts: 0,
        failedInserts: 0,
        skippedRecords: 0
      },
      migratedFiles: [],
      errors: []
    }

    console.log('🚀 SQLite Migration Tool Initialized')
    console.log('📊 SQLite Path:', this.sqlitePath)
  }

  async testConnection() {
    console.log('🔍 Testing database connection...')

    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1)
      if (error) throw error

      console.log('✅ Supabase connection successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
  }

  async migrateCustomers() {
    console.log('📊 Migrating customers from SQLite...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, async (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query customers table, skip header rows
        const query = `SELECT * FROM V_Müşteriler WHERE "Unnamed: 3" IS NOT NULL AND "Unnamed: 3" != 'MÜŞTERİLER' AND "Unnamed: 3" != 'Ad Soyadı'`

        db.all(query, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying customers:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} customer records to process`)

          if (rows.length === 0) {
            console.log('⚠️ No customers to migrate')
            db.close()
            resolve()
            return
          }

          // Process customers
          const customers = []
          let processed = 0

          for (const row of rows) {
            processed++

            // Skip empty rows
            if (!row['Unnamed: 3'] || row['Unnamed: 3'].trim() === '') {
              this.migrationResults.summary.skippedRecords++
              continue
            }

            // Create customer object
            const customer = {
              id: `customer_${row['Unnamed: 2']?.trim()}_${Date.now()}_${processed}`,
              name: row['Unnamed: 3']?.trim() || '',
              phone: row['Unnamed: 4']?.trim() || null,
              address: row['Unnamed: 5']?.trim() || null,
              city: row['Unnamed: 6']?.trim() || null,
              state: row['Unnamed: 7']?.trim() || null,
              email: `customer_${row['Unnamed: 2']?.trim()}_${Date.now()}_${processed}@migration.local`, // Unique email
              zip_code: null,
              country: 'Turkey',
              role: 'CUSTOMER',
              newsletter_subscription: false,
              preferences: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            customers.push(customer)

            // Debug: Log first few customers
            if (processed <= 3) {
              console.log(`🔍 Processing customer: ${customer.name}`)
            }
          }

          console.log(`✅ Processed ${customers.length} customers`)

          // Insert in batches
          if (customers.length > 0) {
            await this.insertBatch('users', customers, 50)
          }

          console.log('✅ Customer migration completed')
          db.close()
          resolve()
        })
      })
    })
  }

  async migrateProducts() {
    console.log('📊 Migrating products from SQLite...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, async (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query products table, skip header rows
        const query = `SELECT * FROM V_Ürünler WHERE "Unnamed: 4" IS NOT NULL AND "Unnamed: 4" != 'ÜRÜNLER' AND "Unnamed: 4" != 'Ürün Adı'`

        db.all(query, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying products:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} product records to process`)

          if (rows.length === 0) {
            console.log('⚠️ No products to migrate')
            db.close()
            resolve()
            return
          }

          // Process products
          const products = []
          let processed = 0

          for (const row of rows) {
            processed++

            // Skip empty rows
            if (!row['Unnamed: 4'] || row['Unnamed: 4'].trim() === '') {
              this.migrationResults.summary.skippedRecords++
              continue
            }

            // Create product object
            const product = {
              id: `product_${row['Unnamed: 2']?.trim()}_${Date.now()}_${processed}`,
              name: row['Unnamed: 4']?.trim() || '',
              slug: `product-${row['Unnamed: 2']?.trim()}-${Date.now()}-${processed}`.toLowerCase().replace(/\s+/g, '-'), // Unique slug
              sku: `sku_${row['Unnamed: 2']?.trim()}_${Date.now()}_${processed}`, // Unique SKU
              categoryId: 'default-category', // TODO: Create default category
              price: 0, // TODO: Calculate from sales price
              stock: 0, // TODO: Set from inventory
              isActive: true,
              isFeatured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            products.push(product)

            // Debug: Log first few products
            if (processed <= 2) {
              console.log(`🔍 Processing product: ${product.name}`)
            }
          }

          console.log(`✅ Processed ${products.length} products`)

          // Insert in batches
          if (products.length > 0) {
            await this.insertBatch('products', products, 25)
          }

          console.log('✅ Product migration completed')
          db.close()
          resolve()
        })
      })
    })
  }

  async migrateOrders() {
    console.log('📊 Migrating orders from SQLite...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, async (err) => {
        if (err) {
          console.error('❌ Error opening SQLite database:', err.message)
          reject(err)
          return
        }

        console.log('✅ SQLite database opened successfully')

        // Query orders table
        const query = 'SELECT * FROM G_Siparişler WHERE "Unnamed: 1" IS NOT NULL'

        db.all(query, async (err, rows) => {
          if (err) {
            console.error('❌ Error querying orders:', err.message)
            db.close()
            reject(err)
            return
          }

          console.log(`📋 Found ${rows.length} order records to process`)

          if (rows.length === 0) {
            console.log('⚠️ No orders to migrate')
            db.close()
            resolve()
            return
          }

          // Process orders
          const orders = []
          let processed = 0

          for (const row of rows) {
            processed++

            // Skip empty rows
            if (!row['Unnamed: 1'] || row['Unnamed: 1'].trim() === '') {
              this.migrationResults.summary.skippedRecords++
              continue
            }

            // Create order object
            const order = {
              id: `order_${processed}_${Date.now()}`,
              orderNumber: `ORD-${processed}-${Date.now()}`, // Unique order number
              userId: null, // TODO: Link to customer
              status: 'PENDING',
              totalAmount: 0, // TODO: Calculate total
              customerName: row['Unnamed: 2']?.trim() || 'Unknown Customer',
              customerEmail: `customer_${row['Unnamed: 2']?.trim()}_${Date.now()}_${processed}@migration.local`,
              customerPhone: row['Unnamed: 3']?.trim() || null,
              shippingAddress: row['Unnamed: 4']?.trim() || null,
              shippingCity: row['Unnamed: 5']?.trim() || null,
              shippingState: row['Unnamed: 6']?.trim() || null,
              shippingZip: row['Unnamed: 7']?.trim() || null,
              shippingCountry: 'Turkey',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            orders.push(order)

            // Debug: Log first few orders
            if (processed <= 2) {
              console.log(`🔍 Processing order: ${order.id}`)
            }
          }

          console.log(`✅ Processed ${orders.length} orders`)

          // Insert in batches
          if (orders.length > 0) {
            await this.insertBatch('orders', orders, 25)
          }

          console.log('✅ Order migration completed')
          db.close()
          resolve()
        })
      })
    })
  }

  async insertBatch(tableName, records, batchSize) {
    console.log(`📦 Inserting ${records.length} records to ${tableName} in batches of ${batchSize}`)

    let successfulInserts = 0
    let failedInserts = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(records.length / batchSize)

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`)

      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .insert(batch)
          .select()

        if (error) {
          console.error(`❌ Error inserting batch ${batchNumber}:`, error.message)
          failedInserts += batch.length
        } else {
          const inserted = data?.length || 0
          console.log(`✅ Successfully inserted ${inserted} records in batch ${batchNumber}`)
          successfulInserts += inserted
        }
      } catch (err) {
        console.error(`❌ Exception in batch ${batchNumber}:`, err.message)
        failedInserts += batch.length
      }
    }

    console.log(`📊 Batch insert summary: ${successfulInserts} successful, ${failedInserts} failed`)

    this.migrationResults.summary.successfulInserts += successfulInserts
    this.migrationResults.summary.failedInserts += failedInserts
    this.migrationResults.summary.totalRecords += records.length
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      database: 'takip_programi.db',
      results: this.migrationResults,
      summary: {
        totalProcessed: this.migrationResults.summary.totalRecords,
        successful: this.migrationResults.summary.successfulInserts,
        failed: this.migrationResults.summary.failedInserts,
        skipped: this.migrationResults.summary.skippedRecords,
        successRate: this.migrationResults.summary.totalRecords > 0
          ? ((this.migrationResults.summary.successfulInserts / this.migrationResults.summary.totalRecords) * 100).toFixed(2) + '%'
          : '0%'
      }
    }

    const reportPath = path.join(__dirname, 'migration-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('📄 Migration report generated:', reportPath)
    console.log('📊 Final Summary:', report.summary)

    return report
  }

  async runMigration() {
    console.log('🚀 Starting SQLite to Supabase Migration')
    console.log('=' * 50)

    try {
      // Test connection
      const connectionOk = await this.testConnection()
      if (!connectionOk) {
        throw new Error('Database connection failed')
      }

      // Run migrations
      await this.migrateCustomers()
      console.log('')

      await this.migrateProducts()
      console.log('')

      await this.migrateOrders()
      console.log('')

      // Generate report
      await this.generateReport()

      console.log('🎉 Migration completed successfully!')

    } catch (error) {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    }
  }

  async testMigration() {
    console.log('🧪 Running migration test...')

    try {
      const connectionOk = await this.testConnection()
      if (!connectionOk) {
        console.error('❌ Connection test failed')
        return
      }

      await this.migrateCustomers()

      console.log('✅ Test completed successfully!')

    } catch (error) {
      console.error('❌ Test failed:', error.message)
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const migration = new SQLiteMigration()

  if (args.includes('--test-customers')) {
    await migration.testMigration()
  } else if (args.includes('--run')) {
    await migration.runMigration()
  } else {
    console.log('📖 Usage:')
    console.log('  node sqlite-migration.js --test-customers  # Test customer migration')
    console.log('  node sqlite-migration.js --run            # Run full migration')
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = SQLiteMigration

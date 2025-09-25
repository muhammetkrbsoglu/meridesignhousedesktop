#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

class SQLiteToSupabaseMigration {
  constructor() {
    this.sqlitePath = path.join(__dirname, 'takip_programi.db')
    this.migrationResults = {
      summary: {
        totalRecords: 0,
        successfulInserts: 0,
        failedInserts: 0,
        skippedRecords: 0
      },
      errors: [],
      migratedFiles: []
    }

    // Supabase connection - you'll need to add your credentials
    this.supabaseUrl = process.env.SUPABASE_URL
    this.supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file')
      process.exit(1)
    }

    console.log('🔌 Initializing Supabase connection...')
    console.log('Supabase URL:', this.supabaseUrl)
  }

  async testSQLite() {
    console.log('🧪 Testing SQLite database connection...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, (err) => {
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

    const customers = []

    return new Promise((resolve, reject) => {
      console.log('Opening SQLite database:', this.sqlitePath)

      const db = new sqlite3.Database(this.sqlitePath, sqlite3.OPEN_READONLY, (err) => {
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

            const batchSize = 50
            let successfulInserts = 0
            let failedInserts = 0

            // Process batches sequentially using promises
            const processBatches = async () => {
              for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize)
                console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(customers.length / batchSize)} (${batch.length} customers)`)

                try {
                  // For now, just log the batch instead of inserting to Supabase
                  console.log(`✅ Would insert batch ${Math.floor(i / batchSize) + 1} with ${batch.length} customers`)
                  successfulInserts += batch.length

                  // Uncomment this when you want to actually insert to Supabase:
                  /*
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
                  */
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

          console.log(`✅ Customer migration completed successfully`)
          this.migrationResults.summary.totalRecords += customers.length
          resolve()
        })
      })
    })
  }
}

async function main() {
  console.log('🚀 Starting SQLite to Supabase Migration Test')
  console.log('=' * 50)

  const migration = new SQLiteToSupabaseMigration()

  try {
    // Test SQLite connection first
    await migration.testSQLite()
    console.log('')

    // Test customer migration (dry run)
    await migration.migrateCustomers()

    console.log('')
    console.log('✅ Migration test completed successfully!')
    console.log('📋 Summary:', migration.migrationResults.summary)

  } catch (error) {
    console.error('❌ Migration test failed:', error)
    process.exit(1)
  }
}

main()

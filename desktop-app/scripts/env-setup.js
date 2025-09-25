/**
 * Environment Setup Script
 * Sets up environment variables for different environments
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

class EnvSetup {
  constructor() {
    this.envFiles = {
      development: '.env',
      staging: '.env.staging',
      production: '.env.production'
    }
  }

  async setupEnvironment(environment = 'development') {
    console.log(`🔧 Setting up ${environment} environment...`)

    try {
      const envFile = this.envFiles[environment]
      const exampleFile = `${envFile}.example`

      if (!fs.existsSync(exampleFile)) {
        throw new Error(`Environment example file not found: ${exampleFile}`)
      }

      if (!fs.existsSync(envFile)) {
        console.log(`📄 Creating ${envFile} from ${exampleFile}...`)

        // Copy example to actual env file
        fs.copyFileSync(exampleFile, envFile)

        // Generate secure random keys
        await this.generateSecureKeys(envFile)

        console.log(`✅ Created ${envFile} with generated secure keys`)
        console.log(`📝 Please edit ${envFile} and fill in your actual values`)

      } else {
        console.log(`✅ ${envFile} already exists`)
        console.log(`📝 Please verify the values in ${envFile}`)
      }

      // Validate environment file
      await this.validateEnvironment(envFile)

      // Show environment summary
      await this.showEnvironmentSummary(envFile)

    } catch (error) {
      console.error('❌ Environment setup failed:', error)
      process.exit(1)
    }
  }

  async generateSecureKeys(envFile) {
    console.log('🔑 Generating secure keys...')

    let envContent = fs.readFileSync(envFile, 'utf8')

    // Generate JWT secret
    const jwtSecret = crypto.randomBytes(64).toString('hex')
    envContent = envContent.replace(/JWT_SECRET=.*$/, `JWT_SECRET=${jwtSecret}`)

    // Generate encryption key
    const encryptionKey = crypto.randomBytes(32).toString('hex')
    envContent = envContent.replace(/ENCRYPTION_KEY=.*$/, `ENCRYPTION_KEY=${encryptionKey}`)

    // Generate app password for email
    const appPassword = this.generateSecurePassword()
    envContent = envContent.replace(/SMTP_PASS=.*$/, `SMTP_PASS=${appPassword}`)

    fs.writeFileSync(envFile, envContent)
    console.log('✅ Generated secure keys')
  }

  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''

    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return password
  }

  async validateEnvironment(envFile) {
    console.log('🔍 Validating environment configuration...')

    const envContent = fs.readFileSync(envFile, 'utf8')
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ]

    const missing = []
    const empty = []

    for (const varName of requiredVars) {
      const regex = new RegExp(`^${varName}=(.*)$`, 'm')
      const match = envContent.match(regex)

      if (!match) {
        missing.push(varName)
      } else if (!match[1] || match[1].trim() === '') {
        empty.push(varName)
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    if (empty.length > 0) {
      console.warn(`⚠️ Empty environment variables: ${empty.join(', ')}`)
    }

    console.log('✅ Environment validation passed')
  }

  async showEnvironmentSummary(envFile) {
    console.log('📊 Environment Summary:')
    console.log(`Environment: ${path.basename(envFile, '.env')}`)
    console.log(`Config File: ${envFile}`)

    const envContent = fs.readFileSync(envFile, 'utf8')
    const lines = envContent.split('\n')

    console.log('\n🔧 Configuration:')
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=')
        if (key && value) {
          // Mask sensitive values
          const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'DSN']
          const isSensitive = sensitiveKeys.some(sensitive =>
            key.toUpperCase().includes(sensitive)
          )

          const displayValue = isSensitive ? '***masked***' : value
          console.log(`  ${key}=${displayValue}`)
        }
      }
    })

    console.log('\n✅ Environment setup completed successfully!')
    console.log(`📝 Next step: Fill in your actual values in ${envFile}`)
  }

  async setupAllEnvironments() {
    console.log('🌍 Setting up all environments...')

    for (const environment of ['development', 'staging', 'production']) {
      console.log(`\n--- Setting up ${environment} environment ---`)
      await this.setupEnvironment(environment)
    }

    console.log('\n🎉 All environments configured!')
    console.log('📝 Please fill in the actual values in each .env file')
  }

  async validateAllEnvironments() {
    console.log('🔍 Validating all environments...')

    let allValid = true

    for (const environment of ['development', 'staging', 'production']) {
      const envFile = this.envFiles[environment]

      if (fs.existsSync(envFile)) {
        try {
          console.log(`\n--- Validating ${environment} ---`)
          await this.validateEnvironment(envFile)
          console.log(`✅ ${environment} environment is valid`)
        } catch (error) {
          console.log(`❌ ${environment} environment validation failed: ${error.message}`)
          allValid = false
        }
      } else {
        console.log(`⚠️ ${environment} environment file not found: ${envFile}`)
        allValid = false
      }
    }

    if (allValid) {
      console.log('\n🎉 All environments are properly configured!')
    } else {
      console.log('\n⚠️ Some environments need attention')
    }

    return allValid
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0] || 'development'
  const action = args[1] || 'setup'

  const envSetup = new EnvSetup()

  switch (action) {
    case 'setup':
      if (command === 'all') {
        envSetup.setupAllEnvironments()
      } else {
        envSetup.setupEnvironment(command)
      }
      break

    case 'validate':
      if (command === 'all') {
        envSetup.validateAllEnvironments()
      } else {
        envSetup.validateEnvironment(envSetup.envFiles[command] || `.env.${command}`)
      }
      break

    default:
      console.log('Usage: node scripts/env-setup.js [environment] [action]')
      console.log('Environments: development, staging, production, all')
      console.log('Actions: setup, validate')
      console.log('Examples:')
      console.log('  node scripts/env-setup.js development setup')
      console.log('  node scripts/env-setup.js all setup')
      console.log('  node scripts/env-setup.js production validate')
  }
}

module.exports = EnvSetup

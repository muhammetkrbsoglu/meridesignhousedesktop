/**
 * CSV Encoding Fixer
 * Fixes CSV files encoding issues by converting to proper UTF-8
 */

const fs = require('fs')
const path = require('path')
const iconv = require('iconv-lite')

class CSVFixer {
  constructor() {
    this.files = [
      'TAKİP PROGRAMI 1(müşteriler).csv',
      'TAKİP PROGRAMI 1(ürünler).csv',
      'TAKİP PROGRAMI 1(siparişler).csv',
      'TAKİP PROGRAMI 1(yarı-mamul-listesi).csv',
      'TAKİP PROGRAMI 1(sipariş-verilecek-malzemeler).csv',
      'TAKİP PROGRAMI 1(kargo-ücretleri).csv',
      'TAKİP PROGRAMI 1(il-ilçe).csv'
    ]
  }

  async fixAllFiles() {
    console.log('🔧 Starting CSV encoding fix...')

    for (const fileName of this.files) {
      const inputPath = path.join('C:', 'Users', 'fower', 'Desktop', 'meridesignhousedesktop', 'excel', fileName)
      const outputPath = path.join('C:', 'Users', 'fower', 'Desktop', 'meridesignhousedesktop', 'excel', `fixed_${fileName}`)

      try {
        await this.fixFile(inputPath, outputPath, fileName)
        console.log(`✅ Fixed: ${fileName}`)
      } catch (error) {
        console.error(`❌ Failed to fix ${fileName}:`, error.message)
      }
    }

    console.log('📋 CSV encoding fix completed!')
    console.log('Original files are preserved. Fixed files have "fixed_" prefix.')
  }

  async fixFile(inputPath, outputPath, fileName) {
    return new Promise((resolve, reject) => {
      const content = fs.readFileSync(inputPath)

      // Try different encodings
      const encodings = ['utf8', 'win1254', 'iso-8859-9']

      let fixedContent = null
      let detectedEncoding = null

      for (const encoding of encodings) {
        try {
          const decoded = iconv.decode(content, encoding)
          const encoded = iconv.encode(decoded, 'utf8')

          // Check if content looks correct (no BOM and proper Turkish characters)
          if (!encoded.toString('utf8').includes('ï»¿') &&
              encoded.toString('utf8').includes('Ad Soyadı')) {
            fixedContent = encoded
            detectedEncoding = encoding
            break
          }
        } catch (error) {
          // Try next encoding
        }
      }

      if (!fixedContent) {
        throw new Error('Could not detect proper encoding')
      }

      console.log(`  📝 ${fileName}: Detected encoding ${detectedEncoding}`)

      // Write fixed file
      fs.writeFileSync(outputPath, fixedContent)

      resolve()
    })
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new CSVFixer()
  fixer.fixAllFiles().catch(console.error)
}

module.exports = CSVFixer

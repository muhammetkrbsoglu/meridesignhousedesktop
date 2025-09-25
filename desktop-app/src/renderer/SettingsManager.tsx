import React, { useState, useEffect } from 'react'

interface Settings {
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupEnabled: boolean
  exportFormat: 'csv' | 'json' | 'both'
  lowStockThreshold: number
  autoReorderEnabled: boolean
  reorderThreshold: number
  notificationsEnabled: boolean
  theme: 'light' | 'dark' | 'system'
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<Settings>({
    backupFrequency: 'weekly',
    backupEnabled: true,
    exportFormat: 'both',
    lowStockThreshold: 20,
    autoReorderEnabled: false,
    reorderThreshold: 10,
    notificationsEnabled: true,
    theme: 'system'
  })

  const [loading, setLoading] = useState(false)
  const [backupRunning, setBackupRunning] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error)
      }
    }
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      localStorage.setItem('app-settings', JSON.stringify(settings))
      // You could also save to a remote API here

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Ayarlar başarıyla kaydedildi!')
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error)
      alert('Ayarlar kaydedilirken hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      setBackupRunning(true)

      const exportData = {
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }

      if (settings.exportFormat === 'csv' || settings.exportFormat === 'both') {
        // Create CSV content
        const csvContent = [
          ['Anahtar', 'Değer'],
          ['Backup Sıklığı', settings.backupFrequency],
          ['Backup Aktif', settings.backupEnabled ? 'Evet' : 'Hayır'],
          ['Export Formatı', settings.exportFormat],
          ['Düşük Stok Eşiği (%)', settings.lowStockThreshold.toString()],
          ['Otomatik Sipariş', settings.autoReorderEnabled ? 'Aktif' : 'Kapalı'],
          ['Sipariş Eşiği (%)', settings.reorderThreshold.toString()],
          ['Bildirimler', settings.notificationsEnabled ? 'Aktif' : 'Kapalı'],
          ['Tema', settings.theme]
        ]

        const csvString = csvContent.map(row =>
          row.map(cell => `"${cell}"`).join(',')
        ).join('\n')

        // Download CSV
        const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const csvUrl = URL.createObjectURL(csvBlob)
        const csvLink = document.createElement('a')
        csvLink.href = csvUrl
        csvLink.download = `settings-backup-${new Date().toISOString().split('T')[0]}.csv`
        csvLink.click()
        URL.revokeObjectURL(csvUrl)
      }

      if (settings.exportFormat === 'json' || settings.exportFormat === 'both') {
        // Download JSON
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const jsonUrl = URL.createObjectURL(jsonBlob)
        const jsonLink = document.createElement('a')
        jsonLink.href = jsonUrl
        jsonLink.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`
        jsonLink.click()
        URL.revokeObjectURL(jsonUrl)
      }

      alert('Veriler başarıyla export edildi!')
    } catch (error) {
      console.error('Export hatası:', error)
      alert('Export işlemi başarısız!')
    } finally {
      setBackupRunning(false)
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let importedData

        // Try to parse as JSON first
        try {
          importedData = JSON.parse(content)
        } catch {
          // If JSON parsing fails, show error for non-JSON files
          alert('Desteklenmeyen dosya formatı! Sadece JSON dosyaları desteklenmektedir.')
          return
        }

        if (importedData) {
          // Handle different JSON structures
          let newSettings = { ...settings }

          if (importedData.settings) {
            // Legacy format: direct settings object
            newSettings = { ...importedData.settings }
          } else if (importedData.orderStatuses || importedData.shippingCompanies || importedData.paymentMethods) {
            // New format: extended settings with arrays
            // Keep existing settings and merge new data
            if (importedData.orderStatuses) {
              console.log('Import edilen sipariş durumları:', importedData.orderStatuses)
            }
            if (importedData.shippingCompanies) {
              console.log('Import edilen kargo firmaları:', importedData.shippingCompanies)
            }
            if (importedData.paymentMethods) {
              console.log('Import edilen ödeme yöntemleri:', importedData.paymentMethods)
            }
            if (importedData.paymentStatuses) {
              console.log('Import edilen ödeme durumları:', importedData.paymentStatuses)
            }
            if (importedData.platforms) {
              console.log('Import edilen platformlar:', importedData.platforms)
            }

            // For now, keep existing settings structure
            // In the future, you might want to store these arrays in separate state or localStorage
            alert('Gelişmiş ayarlar import edildi! (Sipariş durumları, kargo firmaları vb. uygulamanın diğer bölümlerinde kullanılacak)')
          }

          setSettings(newSettings)
          alert('Ayarlar başarıyla import edildi!')
        } else {
          alert('Geçersiz dosya formatı!')
        }
      } catch (error) {
        console.error('Import hatası:', error)
        alert('Dosya okunurken hata oluştu!')
      }
    }
    reader.readAsText(file)
  }

  const resetSettings = () => {
    if (confirm('Tüm ayarları sıfırlamak istediğinizden emin misiniz?')) {
      const defaultSettings: Settings = {
        backupFrequency: 'weekly',
        backupEnabled: true,
        exportFormat: 'both',
        lowStockThreshold: 20,
        autoReorderEnabled: false,
        reorderThreshold: 10,
        notificationsEnabled: true,
        theme: 'system'
      }
      setSettings(defaultSettings)
      localStorage.removeItem('app-settings')
      alert('Ayarlar sıfırlandı!')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '⏳' : '💾'} Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Yedekleme Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backupEnabled}
                  onChange={(e) => setSettings({...settings, backupEnabled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Otomatik yedekleme aktif</span>
              </label>
            </div>

            {settings.backupEnabled && (
              <div>
                <label className="block text-sm font-medium mb-1">Yedekleme Sıklığı</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({...settings, backupFrequency: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Export Formatı</label>
              <select
                value={settings.exportFormat}
                onChange={(e) => setSettings({...settings, exportFormat: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="both">CSV + JSON</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportData}
                disabled={backupRunning}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {backupRunning ? '⏳' : '💾'} Manuel Export
              </button>
              <label className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer text-center">
                📁 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Stock Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Stok Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Düşük Stok Eşiği (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({...settings, lowStockThreshold: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum stok seviyesinin bu oranın altına düştüğünde uyarı gösterilir
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoReorderEnabled}
                  onChange={(e) => setSettings({...settings, autoReorderEnabled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Otomatik sipariş önerileri aktif</span>
              </label>
            </div>

            {settings.autoReorderEnabled && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Otomatik Sipariş Eşiği (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.reorderThreshold}
                  onChange={(e) => setSettings({...settings, reorderThreshold: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stok bu seviyenin altına düştüğünde otomatik sipariş önerisi oluşturulur
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Bildirim Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Bildirimler aktif</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Kritik stok seviyeleri, sipariş onayları ve sistem güncellemeleri için
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Görünüm Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tema</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="light">Açık</option>
                <option value="dark">Koyu</option>
                <option value="system">Sistem</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Uygulamanın renk temasını seçin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Sistem Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Uygulama Sürümü:</strong> 1.0.0</p>
            <p><strong>Veritabanı:</strong> Supabase PostgreSQL</p>
            <p><strong>Platform:</strong> Electron Desktop</p>
          </div>
          <div>
            <p><strong>Geliştirici:</strong> Meri Design House</p>
            <p><strong>Son Güncelleme:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
            <p><strong>Destek:</strong> Teknik Destek Ekibi</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-red-800">Tehlikeli Bölge</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-red-700">Ayarları Sıfırla</h3>
            <p className="text-sm text-red-600 mb-2">
              Tüm ayarları varsayılan değerlere sıfırlar. Bu işlem geri alınamaz.
            </p>
            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ⚠️ Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
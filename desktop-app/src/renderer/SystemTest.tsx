import React, { useState, useEffect } from 'react'
import { runAllTests, testSupabaseConnection, testRealtimeConnection, testStockDepletion } from './test-connection'

interface TestResult {
  connection: boolean
  realtime: boolean
  stockDepletion: boolean
}

export default function SystemTest() {
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    try {
      setRunning(true)
      setError(null)
      const results = await runAllTests()
      setTestResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
      console.error('Test hatası:', err)
    } finally {
      setRunning(false)
    }
  }

  const runIndividualTest = async (testName: keyof TestResult) => {
    try {
      setError(null)
      let result = false

      switch (testName) {
        case 'connection':
          result = await testSupabaseConnection()
          break
        case 'realtime':
          result = await testRealtimeConnection()
          break
        case 'stockDepletion':
          result = await testStockDepletion()
          break
      }

      setTestResults(prev => prev ? { ...prev, [testName]: result } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
      console.error('Test hatası:', err)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌'
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sistem Testi</h1>
        <button
          onClick={runTests}
          disabled={running}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {running ? '⏳ Test Çalışıyor...' : '🔄 Tüm Testleri Çalıştır'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Test Hatası</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Supabase Bağlantısı</h2>
            <span className={`text-2xl ${testResults?.connection !== undefined ? getStatusColor(testResults.connection) : 'text-gray-400'}`}>
              {testResults?.connection !== undefined ? getStatusIcon(testResults.connection) : '⏳'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Veritabanı bağlantısını ve temel veri çekme işlemlerini test eder.
          </p>
          <button
            onClick={() => runIndividualTest('connection')}
            disabled={running}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {running ? 'Test Ediliyor...' : 'Tekrar Test Et'}
          </button>
        </div>

        {/* Realtime Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Gerçek Zamanlı Bağlantı</h2>
            <span className={`text-2xl ${testResults?.realtime !== undefined ? getStatusColor(testResults.realtime) : 'text-gray-400'}`}>
              {testResults?.realtime !== undefined ? getStatusIcon(testResults.realtime) : '⏳'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Supabase realtime bağlantısını ve canlı güncelleme özelliklerini test eder.
          </p>
          <button
            onClick={() => runIndividualTest('realtime')}
            disabled={running}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {running ? 'Test Ediliyor...' : 'Tekrar Test Et'}
          </button>
        </div>

        {/* Stock Depletion Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Otomatik Stok Düşme</h2>
            <span className={`text-2xl ${testResults?.stockDepletion !== undefined ? getStatusColor(testResults.stockDepletion) : 'text-gray-400'}`}>
              {testResults?.stockDepletion !== undefined ? getStatusIcon(testResults.stockDepletion) : '⏳'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Sipariş onayında stok düşme fonksiyonunu test eder.
          </p>
          <button
            onClick={() => runIndividualTest('stockDepletion')}
            disabled={running}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {running ? 'Test Ediliyor...' : 'Tekrar Test Et'}
          </button>
        </div>
      </div>

      {/* Test Summary */}
      {testResults && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Test Özeti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Supabase Bağlantısı:</span>
                <span className={testResults.connection ? 'text-green-600' : 'text-red-600'}>
                  {testResults.connection ? '✅ Başarılı' : '❌ Başarısız'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Gerçek Zamanlı Bağlantı:</span>
                <span className={testResults.realtime ? 'text-green-600' : 'text-red-600'}>
                  {testResults.realtime ? '✅ Başarılı' : '❌ Başarısız'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Otomatik Stok Düşme:</span>
                <span className={testResults.stockDepletion ? 'text-green-600' : 'text-red-600'}>
                  {testResults.stockDepletion ? '✅ Başarılı' : '❌ Başarısız'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded font-bold">
                <span>Genel Durum:</span>
                <span className={Object.values(testResults).every(Boolean) ? 'text-green-600' : 'text-red-600'}>
                  {Object.values(testResults).every(Boolean) ? '🎉 Tüm Testler Başarılı!' : '⚠️ Bazı Testler Başarısız'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Sistem Durumu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Mevcut Özellikler</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Dashboard (gerçek zamanlı)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Stok Yönetimi
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Sipariş Senkronizasyonu
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Tedarikçi Yönetimi
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Ürün & Reçete Yönetimi
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Raporlar (CSV Export)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Ayarlar
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Sistem Bilgileri</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">📊</span>
                Veritabanı: Supabase PostgreSQL
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">⚡</span>
                Frontend: React + TypeScript
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🖥️</span>
                Platform: Electron Desktop
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">📡</span>
                Senkronizasyon: Supabase Realtime
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">📱</span>
                UI: Tailwind CSS
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔄</span>
                Durum: {testResults && Object.values(testResults).every(Boolean) ? 'Hazır' : 'Test Ediliyor...'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
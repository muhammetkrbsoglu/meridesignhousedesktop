import React from 'react'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Button } from './ui/Button'
import { 
  ArrowRightIcon,
  SearchIcon,
  FilterIcon,
  XIcon
} from './icons/index'

interface OrderFiltersProps {
  searchTerm: string
  filterStatus: string
  isStatusDropdownOpen: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (status: string) => void
  onDropdownToggle: () => void
  getStatusDisplayText: (status: string) => string
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  filterStatus,
  isStatusDropdownOpen,
  onSearchChange,
  onStatusChange,
  onDropdownToggle,
  getStatusDisplayText
}) => {
  const handleStatusSelect = (status: string) => {
    onStatusChange(status)
  }

  const clearSearch = () => {
    onSearchChange('')
  }

  const statusOptions = [
    { value: 'all', label: 'Tüm durumlar', icon: '🌟', color: 'text-gray-600' },
    { value: 'PENDING', label: 'Onay Sürecinde', icon: '⏳', color: 'text-amber-600' },
    { value: 'CONFIRMED', label: 'Onaylandı', icon: '✅', color: 'text-blue-600' },
    { value: 'PROCESSING', label: 'İşleniyor', icon: '⚙️', color: 'text-indigo-600' },
    { value: 'READY_TO_SHIP', label: 'Kargoya Hazır', icon: '📦', color: 'text-emerald-600' },
    { value: 'SHIPPED', label: 'Kargoda', icon: '🚚', color: 'text-violet-600' },
    { value: 'DELIVERED', label: 'Teslim Edildi', icon: '🎉', color: 'text-green-600' },
    { value: 'CANCELLED', label: 'İptal Edildi', icon: '❌', color: 'text-red-600' },
    { value: 'REFUNDED', label: 'İade Edildi', icon: '↩️', color: 'text-gray-600' }
  ]

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
          <FilterIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Filtreler</h2>
          <p className="text-sm text-gray-600">Siparişleri arayın ve filtreleyin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Section */}
        <div className="space-y-3">
          <Label htmlFor="search" className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
            <SearchIcon className="w-4 h-4 text-blue-600" />
            <span>Arama</span>
          </Label>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 transition-opacity duration-500"></div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400 transition-colors duration-300" />
              </div>
              
              <Input
                id="search"
                placeholder="Sipariş no, müşteri adı veya email ara..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="
                  pl-10 pr-10 py-3 h-12
                  bg-white/70 backdrop-blur-sm
                  border-2 border-gray-200/50 rounded-xl
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                  transition-all duration-300 shadow-md
                  text-sm placeholder-gray-500
                "
              />
              
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 transition-colors duration-200"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Search Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>İpucu:</strong> Arama yapmak için:</p>
            <ul className="ml-3 space-y-1 text-xs">
              <li>• Sipariş numarası (örn: ORD-2024-001)</li>
              <li>• Müşteri adı veya soyadı</li>
              <li>• Email adresi</li>
              <li>• Telefon numarası</li>
            </ul>
          </div>
        </div>

        {/* Status Filter Section */}
        <div className="space-y-3">
          <Label htmlFor="status" className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
            <FilterIcon className="w-4 h-4 text-purple-600" />
            <span>Durum Filtresi</span>
          </Label>
          
          <div className="relative status-dropdown group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 transition-opacity duration-500"></div>
            
            <div className="relative">
              <button
                type="button"
                onClick={onDropdownToggle}
                className="
                  w-full h-12 px-4 text-left
                  bg-white/70 backdrop-blur-sm
                  border-2 border-gray-200/50 rounded-xl
                  focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                  transition-all duration-300 shadow-md
                  flex justify-between items-center
                "
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {statusOptions.find(s => s.value === filterStatus)?.icon || '🌟'}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {getStatusDisplayText(filterStatus)}
                  </span>
                </div>
                
                <ArrowRightIcon className={`h-4 w-4 text-gray-500 transition-all duration-300 ${isStatusDropdownOpen ? 'rotate-90' : ''}`} />
              </button>
              
              {isStatusDropdownOpen && (
                <div className="absolute z-30 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-lg overflow-hidden max-h-64">
                  <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => handleStatusSelect(status.value)}
                        className={`
                          w-full px-4 py-3 text-left text-sm
                          transition-all duration-200 flex items-center space-x-3
                          ${filterStatus === status.value
                            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-r-4 border-blue-500'
                            : 'text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="text-sm">{status.icon}</span>
                        <span className="font-medium text-sm">{status.label}</span>
                        {filterStatus === status.value && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>🎯 <strong>İpucu:</strong> Durum filtreleri:</p>
            <ul className="ml-3 space-y-1 text-xs">
              <li>• <span className="text-amber-600">⏳</span> Onay bekleyen siparişler</li>
              <li>• <span className="text-blue-600">✅</span> Onaylanmış siparişler</li>
              <li>• <span className="text-indigo-600">⚙️</span> İşlenmekte olan siparişler</li>
              <li>• <span className="text-green-600">🎉</span> Teslim edilmiş siparişler</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200/50">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs font-medium text-gray-700">Hızlı Filtreler:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED'].map((status) => {
            const option = statusOptions.find(s => s.value === status)
            if (!option) return null
            
            return (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`
                  flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all duration-300
                  ${filterStatus === status 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-700'
                  }
                `}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            )
          })}
          
          <button
            onClick={() => handleStatusSelect('all')}
            className={`
              flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium
              transition-all duration-300
              ${filterStatus === 'all' 
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' 
                : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 text-gray-700'
              }
            `}
          >
            <span>🌟</span>
            <span>Tümü</span>
          </button>
        </div>
      </div>
    </div>
  )
}
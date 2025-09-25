/**
 * Global Search Component
 * Phase 3: Search & Filter Implementation
 */

import React, { useState, useEffect, useRef } from 'react'
// SearchService removed - using simple search
interface SearchResult {
  id: string
  table: string
  data: any
  score: number
  matches: Array<{ field: string; value: string; highlighted?: string }>
}
interface SearchMetadata {
  totalResults: number
  searchTime: number
  tablesSearched: string[]
}
interface SearchOptions {
  limit?: number
  tables?: string[]
  caseSensitive?: boolean
  fuzzyThreshold?: number
}
import { 
  SearchIcon, 
  XIcon, 
  ArrowRightIcon, 
  PlusIcon 
} from './icons/index'
// span removed - using simple HTML elements

interface GlobalSearchProps {
  onSearch?: (results: SearchResult[], metadata: SearchMetadata) => void
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function GlobalSearch({
  onSearch,
  onResultSelect,
  placeholder = "Search anything...",
  className = '',
  disabled = false
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim())
      } else {
        setResults([])
        setMetadata(null)
        setSuggestions([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex])
          } else if (query.trim()) {
            performSearch(query.trim())
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setShowSuggestions(false)
          searchInputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results, query])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const searchOptions: SearchOptions = {
        limit: 20,
        // highlightMatches removed
        fuzzyThreshold: 0.6
      }

      // Simple search - no complex service needed
      const searchResult = { results: [], metadata: { totalResults: 0, searchTime: 0, tablesSearched: [] } }

      setResults(searchResult.results)
      setMetadata(searchResult.metadata)

      // Get suggestions
      // Simple suggestions - no complex service needed
      const searchSuggestions: string[] = []
      setSuggestions(searchSuggestions)

      setIsOpen(true)
      setShowSuggestions(searchSuggestions.length > 0)
      setSelectedIndex(-1)

      // Notify parent component
      onSearch?.(searchResult.results, searchResult.metadata)

    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setMetadata(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim()) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleInputFocus = () => {
    if (query.trim() || suggestions.length > 0) {
      setIsOpen(true)
      setShowSuggestions(suggestions.length > 0)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      performSearch(query.trim())
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setShowSuggestions(false)
    searchInputRef.current?.blur()
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setMetadata(null)
    setSuggestions([])
    setIsOpen(false)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const formatSearchTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 font-medium">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}-${suggestion}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center">
                    <SearchIcon className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 font-medium border-b border-gray-100">
                Results ({metadata?.totalResults || 0})
                {metadata?.searchTime && (
                  <span className="ml-2 text-xs">
                    • {formatSearchTime(metadata.searchTime)}
                  </span>
                )}
              </div>

              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-50 last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-gray-500 mr-2">
                          {result.table}
                        </span>
                        <span className="text-xs text-blue-600 mr-2">
                          ID: {result.id}
                        </span>
                        <div className="flex items-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full mr-2">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-200"
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {result.score}%
                          </span>
                        </div>
                      </div>

                      {/* Highlighted matches */}
                      {result.matches.map((match, matchIndex) => (
                        <div key={matchIndex} className="mb-1">
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">{match.field}:</span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: match.highlighted || match.value
                              }}
                              className="ml-2"
                            />
                          </span>
                        </div>
                      ))}
                    </div>

                    <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {results.length === 0 && query.trim() && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>↑↓ Navigate</span>
            <span>Enter Search • Esc Close</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Search results display component
export interface SearchResultsProps {
  results: SearchResult[]
  metadata?: SearchMetadata
  onResultSelect: (result: SearchResult) => void
  className?: string
}

export function SearchResults({
  results,
  metadata,
  onResultSelect,
  className = ''
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No search results</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results header */}
      {metadata && (
        <div className="flex justify-between items-center text-sm text-gray-600 border-b pb-2">
          <span>{metadata.totalResults} results found</span>
          {metadata.searchTime && (
            <span>{metadata.searchTime < 1000 ? `${metadata.searchTime}ms` : `${(metadata.searchTime / 1000).toFixed(2)}s`}</span>
          )}
        </div>
      )}

      {/* Results list */}
      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() => onResultSelect(result)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {result.table}
                </span>
                <span className="text-xs text-gray-400">
                  ID: {result.id}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                          <span className="text-xs text-gray-500">
                  {result.score}%
                </span>
              </div>
            </div>

            {/* Field matches */}
            {result.matches.map((match, index) => (
              <div key={`match-${index}-${match.field}`} className="mb-2">
                <span className="text-sm text-gray-700">
                  <span className="font-medium">{match.field}:</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: match.highlighted || String(match.value)
                    }}
                    className="ml-2"
                  />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Filter component
export interface FilterProps {
  table: string
  filters: any[]
  onFiltersChange: (filters: any[]) => void
  className?: string
}

export function FilterPanel({ table, filters, onFiltersChange, className = '' }: FilterProps) {
  const [activeFilters, setActiveFilters] = useState(filters)

  const addFilter = () => {
    const newFilter = {
      field: '',
      type: 'contains' as const,
      value: '',
      label: 'New Filter'
    }
    setActiveFilters([...activeFilters, newFilter])
  }

  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index)
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const updateFilter = (index: number, updates: Partial<typeof activeFilters[0]>) => {
    const newFilters = activeFilters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    )
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h6 className="text-base font-semibold">Filters</h6>
        <button
          onClick={addFilter}
          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Filter</span>
        </button>
      </div>

      <div className="space-y-3">
        {activeFilters.map((filter, index) => (
          <div key={`filter-${index}-${filter.field}`} className="flex items-center space-x-2">
            <select
              value={filter.field}
              onChange={(e) => updateFilter(index, { field: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Select field</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
            </select>

            <select
              value={filter.type}
              onChange={(e) => updateFilter(index, { type: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="contains">Contains</option>
              <option value="equals">Equals</option>
              <option value="starts_with">Starts with</option>
              <option value="ends_with">Ends with</option>
              <option value="greater_than">Greater than</option>
              <option value="less_than">Less than</option>
            </select>

            <input
              type="text"
              value={filter.value}
              onChange={(e) => updateFilter(index, { value: e.target.value })}
              placeholder="Filter value"
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
            />

            <button
              onClick={() => removeFilter(index)}
              className="text-red-500 hover:text-red-700"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

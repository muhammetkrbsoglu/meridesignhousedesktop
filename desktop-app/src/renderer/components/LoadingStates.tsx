/**
 * Loading States Components
 * Phase 3: Loading States Implementation
 */

import React from 'react'
// Typography removed - using simple HTML elements

// Loading state types
export type LoadingVariant =
  | 'skeleton'        // Skeleton loading with gray blocks
  | 'shimmer'         // Shimmer effect with gradient
  | 'spinner'         // Circular spinner
  | 'pulse'           // Pulse animation
  | 'dots'            // Animated dots
  | 'bars'            // Animated bars
  | 'progress'        // Progress bar

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LoadingProps {
  variant?: LoadingVariant
  size?: LoadingSize
  className?: string
  message?: string
  progress?: number // For progress variant (0-100)
  color?: 'primary' | 'secondary' | 'muted'
  speed?: 'slow' | 'normal' | 'fast'
}

// Loading state configuration
const LOADING_CONFIG = {
  size: {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  },
  color: {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    muted: 'text-gray-300'
  },
  speed: {
    slow: 'duration-1000',
    normal: 'duration-500',
    fast: 'duration-300'
  }
} as const

/**
 * Base Loading Component
 */
export function Loading({
  variant = 'spinner',
  size = 'md',
  className = '',
  message,
  progress,
  color = 'primary',
  speed = 'normal'
}: LoadingProps) {
  const sizeClass = LOADING_CONFIG.size[size]
  const colorClass = LOADING_CONFIG.color[color]
  const speedClass = LOADING_CONFIG.speed[speed]

  const renderVariant = () => {
    switch (variant) {
      case 'skeleton':
        return <SkeletonLoading size={size} className={className} />
      case 'shimmer':
        return <ShimmerLoading size={size} className={className} />
      case 'spinner':
        return <SpinnerLoading size={size} className={className} color={color} speed={speed} />
      case 'pulse':
        return <PulseLoading size={size} className={className} />
      case 'dots':
        return <DotsLoading size={size} className={className} color={color} />
      case 'bars':
        return <BarsLoading size={size} className={className} />
      case 'progress':
        return <ProgressLoading progress={progress || 0} className={className} />
      default:
        return <SpinnerLoading size={size} className={className} color={color} speed={speed} />
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderVariant()}
      {message && (
        <p className="text-sm text-gray-500 mt-3 text-center">
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Skeleton Loading Component
 */
export function SkeletonLoading({ size = 'md', className = '' }: { size?: LoadingSize, className?: string }) {
  const getSkeletonSize = (size: LoadingSize) => {
    const sizeMap = {
      xs: 'w-16 h-4',
      sm: 'w-24 h-6',
      md: 'w-32 h-8',
      lg: 'w-40 h-10',
      xl: 'w-48 h-12'
    }
    return sizeMap[size]
  }

  return (
    <div className={`animate-pulse ${className}`}>
      <div className={`${getSkeletonSize(size)} bg-gray-300 rounded`} />
    </div>
  )
}

/**
 * Shimmer Loading Component
 */
export function ShimmerLoading({ size = 'md', className = '' }: { size?: LoadingSize, className?: string }) {
  const getShimmerSize = (size: LoadingSize) => {
    const sizeMap = {
      xs: 'w-16 h-4',
      sm: 'w-24 h-6',
      md: 'w-32 h-8',
      lg: 'w-40 h-10',
      xl: 'w-48 h-12'
    }
    return sizeMap[size]
  }

  return (
    <div className={`relative overflow-hidden ${getShimmerSize(size)} bg-gray-300 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
    </div>
  )
}

/**
 * Spinner Loading Component
 */
export function SpinnerLoading({
  size = 'md',
  className = '',
  color = 'primary',
  speed = 'normal'
}: {
  size?: LoadingSize
  className?: string
  color?: 'primary' | 'secondary' | 'muted'
  speed?: 'slow' | 'normal' | 'fast'
}) {
  const sizeClass = LOADING_CONFIG.size[size]
  const colorClass = LOADING_CONFIG.color[color]
  const speedClass = LOADING_CONFIG.speed[speed]

  return (
    <div className={`${sizeClass} ${className}`}>
      <svg
        className={`animate-spin ${colorClass} ${speedClass}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

/**
 * Pulse Loading Component
 */
export function PulseLoading({ size = 'md', className = '' }: { size?: LoadingSize, className?: string }) {
  const getPulseSize = (size: LoadingSize) => {
    const sizeMap = {
      xs: 'w-4 h-4',
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
      xl: 'w-12 h-12'
    }
    return sizeMap[size]
  }

  return (
    <div className={`${getPulseSize(size)} ${className}`}>
      <div className="w-full h-full bg-current rounded-full animate-pulse opacity-75" />
    </div>
  )
}

/**
 * Dots Loading Component
 */
export function DotsLoading({
  size = 'md',
  className = '',
  color = 'primary'
}: {
  size?: LoadingSize
  className?: string
  color?: 'primary' | 'secondary' | 'muted'
}) {
  const sizeClass = LOADING_CONFIG.size[size]
  const colorClass = LOADING_CONFIG.color[color]

  return (
    <div className={`flex space-x-1 ${sizeClass} ${className}`}>
      <div className={`w-2 h-2 ${colorClass} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`w-2 h-2 ${colorClass} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`w-2 h-2 ${colorClass} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  )
}

/**
 * Bars Loading Component
 */
export function BarsLoading({ size = 'md', className = '' }: { size?: LoadingSize, className?: string }) {
  const getBarSize = (size: LoadingSize) => {
    const sizeMap = {
      xs: 'w-1 h-4',
      sm: 'w-1 h-6',
      md: 'w-2 h-8',
      lg: 'w-2 h-10',
      xl: 'w-2 h-12'
    }
    return sizeMap[size]
  }

  return (
    <div className={`flex items-end space-x-1 ${className}`}>
      <div className={`${getBarSize(size)} bg-blue-500 rounded animate-pulse`} style={{ animationDelay: '0ms' }} />
      <div className={`${getBarSize(size)} bg-blue-500 rounded animate-pulse`} style={{ animationDelay: '150ms' }} />
      <div className={`${getBarSize(size)} bg-blue-500 rounded animate-pulse`} style={{ animationDelay: '300ms' }} />
      <div className={`${getBarSize(size)} bg-blue-500 rounded animate-pulse`} style={{ animationDelay: '450ms' }} />
    </div>
  )
}

/**
 * Progress Loading Component
 */
export function ProgressLoading({ progress = 0, className = '' }: { progress?: number, className?: string }) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {clampedProgress}%
      </div>
    </div>
  )
}

// Skeleton loaders for specific components
export function TableSkeleton({ rows = 5, columns = 4, className = '' }: { rows?: number, columns?: number, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoading key={`header-${i}`} size="sm" className="flex-1" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoading
              key={`cell-${rowIndex}-${colIndex}`}
              size="sm"
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 3, className = '' }: { count?: number, className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-skeleton-${i}`} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <SkeletonLoading size="lg" />
            <SkeletonLoading size="md" />
            <SkeletonLoading size="sm" />
            <div className="flex space-x-2">
              <SkeletonLoading size="sm" className="w-16" />
              <SkeletonLoading size="sm" className="w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 5, className = '' }: { items?: number, className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-skeleton-${i}`} className="flex items-center space-x-4 p-4 border border-gray-200 rounded">
          <SkeletonLoading size="md" className="rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoading size="md" />
            <SkeletonLoading size="sm" className="w-3/4" />
          </div>
          <SkeletonLoading size="sm" className="w-16" />
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="w-full h-4 bg-gray-300 rounded" />
    </div>
  )
}

export function FormSkeleton({ fields = 4, className = '' }: { fields?: number, className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`form-skeleton-${i}`} className="space-y-2">
          <SkeletonLoading size="sm" className="w-24" />
          <SkeletonLoading size="lg" className="w-full" />
        </div>
      ))}
    </div>
  )
}

// Loading overlay for full page
export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  variant = 'spinner',
  className = ''
}: {
  isVisible: boolean
  message?: string
  variant?: LoadingVariant
  className?: string
}) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 ${className}`}>
      <Loading variant={variant} message={message} size="lg" />
    </div>
  )
}

// Loading button component
export function LoadingButton({
  isLoading,
  loadingText = "Loading...",
  children,
  variant = 'spinner',
  className = '',
  ...props
}: {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: LoadingVariant
  className?: string
  [key: string]: any
}) {
  return (
    <button
      disabled={isLoading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loading variant={variant} size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Loading state hook for React components
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = React.useState(initialLoading)
  const [loadingMessage, setLoadingMessage] = React.useState('')

  const startLoading = (message = 'Loading...') => {
    setIsLoading(true)
    setLoadingMessage(message)
  }

  const stopLoading = () => {
    setIsLoading(false)
    setLoadingMessage('')
  }

  const withLoading = async <T,>(
    asyncFn: () => Promise<T>,
    message = 'Loading...'
  ): Promise<T> => {
    startLoading(message)
    try {
      const result = await asyncFn()
      return result
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  }
}

// CSS animations for loading states
const loadingAnimations = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }

  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse-subtle {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`

// Inject CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = loadingAnimations
  document.head.appendChild(style)
}

export default Loading
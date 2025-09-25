import React from 'react'

type Variant = 'default' | 'secondary' | 'destructive'

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }>
  = ({ className = '', variant = 'default', children, ...props }) => {
  const variantClass = variant === 'secondary' ? 'bg-gray-100 text-gray-800' : variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-800'
  return (
    <span className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge


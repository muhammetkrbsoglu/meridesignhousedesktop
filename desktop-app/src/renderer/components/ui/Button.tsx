import React from 'react'

type Variant = 'default' | 'outline' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant, size?: Size }>
  = ({ className = '', variant = 'default', size = 'md', children, ...props }) => {
  const variantClass = variant === 'outline' ? 'border bg-white' : variant === 'secondary' ? 'bg-gray-100' : 'bg-gray-900 text-white'
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-sm' : size === 'lg' ? 'px-4 py-2 text-lg' : 'px-3 py-2'
  return (
    <button className={`rounded ${variantClass} ${sizeClass} inline-flex items-center gap-2 ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button


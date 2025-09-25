import React from 'react'

export const Select: React.FC<{ value: string, onValueChange: (v: string) => void, children: React.ReactNode }> = ({ value, onValueChange, children }) => (
  <div data-value={value}>{children}</div>
)

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button className={`border rounded px-3 py-2 w-full text-left ${className}`} {...props}>{children}</button>
)

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder || ''}</span>
)

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`border rounded p-2 bg-white ${className}`} {...props}>{children}</div>
)

export const SelectItem: React.FC<{ value: string, children: React.ReactNode, onSelect?: (v: string) => void }>
  = ({ value, children, onSelect }) => (
  <div className="px-2 py-1 cursor-pointer hover:bg-gray-100" onClick={() => onSelect?.(value)}>{children}</div>
)

export default Select


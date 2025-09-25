import React from 'react'

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', children, ...props }) => (
  <label className={`block text-sm mb-1 ${className}`} {...props}>{children}</label>
)

export default Label


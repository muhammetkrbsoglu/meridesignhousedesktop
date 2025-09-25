import React from 'react'

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea className={`border rounded px-3 py-2 w-full ${className}`} {...props} />
)

export default Textarea


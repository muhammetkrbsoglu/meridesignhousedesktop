import React from 'react'

export const Dialog: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
export const DialogTrigger: React.FC<{ asChild?: boolean, children: React.ReactNode }> = ({ children }) => <>{children}</>
export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mb-2 ${className}`} {...props}>{children}</div>
)
export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props}>{children}</h3>
)
export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`p-4 border rounded bg-white ${className}`} {...props}>{children}</div>
)

export default Dialog


import React from 'react'

const Card = ({ 
  children, 
  className = '',
  padding = 'md',
  hover = false,
  ...props 
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const classes = `
    bg-white rounded-xl shadow-sm border border-gray-200
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 ${className}`}>
    {children}
  </div>
)

export default Card
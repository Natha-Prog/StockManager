export default function Logo({ size = 'md', width, className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }

  const sizeClass = width ? 'h-auto' : sizes[size]

  return (
    <img
      src="/logo.png"
      alt="StockManager"
      style={width ? { width } : undefined}
      className={`${sizeClass} object-contain shrink-0 ${className}`}
    />
  )
}

export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`card ${className}`}>
      <div className={padding ? 'card-body' : ''}>{children}</div>
    </div>
  )
}

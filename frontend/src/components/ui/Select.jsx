export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      )}
      <select
        className={`input-field bg-white ${error ? 'border-rose-500' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  )
}

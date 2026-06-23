export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

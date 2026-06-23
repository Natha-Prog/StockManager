export default function StatCard({ title, value, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-500 to-brand-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-rose-500 to-rose-600',
    purple: 'from-violet-500 to-violet-600',
  }

  return (
    <div className="card p-5 sm:p-6 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 break-words">{value}</p>
        </div>
        <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${accents[accent]} shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

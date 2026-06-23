import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, TrendingDown, Activity, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { statisticsAPI } from '../api/api'
import { useSettings } from '../context/SettingsContext'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'

export default function Dashboard() {
  const { t, formatCurrency, formatDate } = useSettings()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStatistics = async () => {
    try {
      setError(null)
      const response = await statisticsAPI.get()
      setStats(response.data)
    } catch {
      setError(t('dashboard.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStatistics() }, [t])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadStatistics} />
  }

  const statCards = [
    { title: t('dashboard.totalProducts'), value: stats?.totalProducts || 0, icon: Package, accent: 'brand' },
    { title: t('dashboard.totalStock'), value: stats?.totalStock || 0, icon: Activity, accent: 'green' },
    { title: t('dashboard.lowStock'), value: stats?.lowStockProducts || 0, icon: TrendingDown, accent: 'red' },
    { title: t('dashboard.totalValue'), value: formatCurrency(stats?.totalValue || 0), icon: DollarSign, accent: 'purple' },
  ]

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">{t('dashboard.weeklyMovements')}</h3>
          {stats?.weeklyChart?.length > 0 ? (
            <div className="w-full h-56 sm:h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="entries" name={t('dashboard.entries')} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exits" name={t('dashboard.exits')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">{t('dashboard.noMovementsWeek')}</p>
          )}
        </Card>

        <Card>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">{t('dashboard.lowStockProducts')}</h3>
          {stats?.lowStockItems?.length > 0 ? (
            <ul className="space-y-2">
              {stats.lowStockItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center gap-3 py-3 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.reference}</p>
                  </div>
                  <Badge variant="danger">{item.stock} / {item.min_stock}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-center py-12">{t('dashboard.noLowStock')}</p>
          )}
          <Link to="/products" className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 mt-4">
            {t('dashboard.viewAllProducts')}
          </Link>
        </Card>
      </div>

      <Card padding={false}>
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-surface-border">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">{t('dashboard.recentActivity')}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{stats?.movementsThisWeek || 0} {t('dashboard.movementsThisWeek')}</p>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('dashboard.date')}</th>
                <th>{t('dashboard.product')}</th>
                <th>{t('dashboard.type')}</th>
                <th>{t('dashboard.quantity')}</th>
                <th className="hidden sm:table-cell">{t('dashboard.by')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {stats?.recentMovements?.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-slate-900">
                    {formatDate(m.created_at, { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="max-w-[140px] sm:max-w-none truncate">{m.product_name}</td>
                  <td>
                    <Badge variant={m.type === 'entry' ? 'success' : 'danger'}>
                      {m.type === 'entry' ? (
                        <><ArrowUp className="w-3 h-3 mr-1 inline" />{t('movements.entry')}</>
                      ) : (
                        <><ArrowDown className="w-3 h-3 mr-1 inline" />{t('movements.exit')}</>
                      )}
                    </Badge>
                  </td>
                  <td className="font-semibold">{m.quantity}</td>
                  <td className="hidden sm:table-cell text-slate-500">{m.user_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!stats?.recentMovements || stats.recentMovements.length === 0) && (
          <p className="text-center text-slate-500 py-10">{t('dashboard.noMovements')}</p>
        )}
      </Card>
    </div>
  )
}

import { useSettings } from '../../context/SettingsContext'
import Button from './Button'

export default function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useSettings()

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-surface-border bg-slate-50/50">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className="text-sm text-slate-600 font-medium order-first sm:order-none">
        {t('common.page')} {page} {t('common.of')} {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t('common.next')}
      </Button>
    </div>
  )
}

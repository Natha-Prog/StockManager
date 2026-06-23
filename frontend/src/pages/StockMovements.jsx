import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowDown, ArrowUp } from 'lucide-react'
import { stockMovementsAPI, productsAPI } from '../api/api'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'

export default function StockMovements() {
  const { t, formatDate } = useSettings()
  const toast = useToast()
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filters, setFilters] = useState({ type: '', product_id: '', from: '', to: '' })
  const [formData, setFormData] = useState({ product_id: '', type: 'entry', quantity: 1, reason: '' })
  const [formError, setFormError] = useState('')

  const loadData = useCallback(async (page = 1) => {
    try {
      setError(null)
      const params = { page, limit: 20 }
      if (filters.type) params.type = filters.type
      if (filters.product_id) params.product_id = filters.product_id
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to

      const [movementsRes, productsRes] = await Promise.all([
        stockMovementsAPI.getAll(params),
        productsAPI.getAll({ limit: 100 }),
      ])
      setMovements(movementsRes.data.data)
      setPagination(movementsRes.data.pagination)
      setProducts(productsRes.data.data)
    } catch {
      setError(t('movements.loadError'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    setLoading(true)
    loadData(1)
  }, [loadData])

  const selectedProduct = products.find((p) => p.id === parseInt(formData.product_id, 10))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const qty = parseInt(formData.quantity, 10)
    if (formData.type === 'exit' && selectedProduct && qty > selectedProduct.stock) {
      setFormError(`${t('movements.insufficientStock')} ${selectedProduct.stock}`)
      return
    }

    setSubmitting(true)
    try {
      await stockMovementsAPI.create({
        ...formData,
        product_id: parseInt(formData.product_id, 10),
        quantity: parseInt(formData.quantity, 10),
      })
      toast.success(t('movements.created'))
      setShowModal(false)
      setFormData({ product_id: '', type: 'entry', quantity: 1, reason: '' })
      loadData(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.error || t('movements.saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && movements.length === 0) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadData(1)} />
  }

  return (
    <div>
      <PageHeader
        title={t('movements.title')}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('movements.newMovement')}
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Select label={t('movements.type')} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">{t('common.all')}</option>
          <option value="entry">{t('movements.entry')}</option>
          <option value="exit">{t('movements.exit')}</option>
        </Select>
        <Select label={t('movements.product')} value={filters.product_id} onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}>
          <option value="">{t('common.all')}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Input label={t('movements.from')} type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Input label={t('movements.to')} type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
      </Card>

      <Card padding={false}>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('movements.date')}</th>
                <th>{t('movements.product')}</th>
                <th>{t('movements.type')}</th>
                <th>{t('movements.quantity')}</th>
                <th className="hidden md:table-cell">{t('movements.reason')}</th>
                <th className="hidden sm:table-cell">{t('movements.by')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="font-medium text-slate-900">
                    {formatDate(movement.created_at, { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="max-w-[140px] sm:max-w-none truncate">
                    {movement.product_name}
                  </td>
                  <td>
                    <Badge variant={movement.type === 'entry' ? 'success' : 'danger'}>
                      {movement.type === 'entry' ? (
                        <><ArrowUp className="w-3 h-3 mr-1 inline" />{t('movements.entry')}</>
                      ) : (
                        <><ArrowDown className="w-3 h-3 mr-1 inline" />{t('movements.exit')}</>
                      )}
                    </Badge>
                  </td>
                  <td className="font-semibold">{movement.quantity}</td>
                  <td className="hidden md:table-cell text-slate-500 max-w-[120px] truncate">{movement.reason || '-'}</td>
                  <td className="hidden sm:table-cell text-slate-500">{movement.user_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movements.length === 0 && (
          <EmptyState
            title={t('movements.noMovements')}
            description={t('movements.startFirst')}
            actionLabel={t('movements.newMovement')}
            onAction={() => setShowModal(true)}
          />
        )}

        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => { setLoading(true); loadData(p) }} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError('') }} title={t('movements.modalTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t('movements.product')} required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}>
            <option value="">{t('movements.selectProduct')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.reference}) — {t('products.stock')}: {product.stock}
              </option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('movements.type')}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="entry" checked={formData.type === 'entry'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mr-2" />
                {t('movements.entry')}
              </label>
              <label className="flex items-center">
                <input type="radio" value="exit" checked={formData.type === 'exit'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mr-2" />
                {t('movements.exit')}
              </label>
            </div>
          </div>

          <Input label={t('movements.quantity')} type="number" min="1" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />

          {formData.type === 'exit' && selectedProduct && (
            <p className="text-sm text-gray-500">{t('movements.availableStock')} : {selectedProduct.stock}</p>
          )}

          <Input label={`${t('movements.reason')} (${t('common.optional')})`} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, Download } from 'lucide-react'
import { productsAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

export default function Products() {
  const { isAdmin } = useAuth()
  const { t, formatCurrency } = useSettings()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', reference: '', category: '', price: '', min_stock: 0,
  })

  const loadProducts = useCallback(async (page = 1) => {
    try {
      setError(null)
      const response = await productsAPI.getAll({ page, limit: 20, search: searchTerm })
      setProducts(response.data.data)
      setPagination(response.data.pagination)
    } catch {
      setError(t('products.loadError'))
    } finally {
      setLoading(false)
    }
  }, [searchTerm, t])

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setLoading(true)
    loadProducts(1)
  }, [loadProducts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        min_stock: parseInt(formData.min_stock, 10) || 0,
      }
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data)
        toast.success(t('products.updated'))
      } else {
        await productsAPI.create(data)
        toast.success(t('products.created'))
      }
      setShowModal(false)
      resetForm()
      loadProducts(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.error || t('products.saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({ name: '', reference: '', category: '', price: '', min_stock: 0 })
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      reference: product.reference,
      category: product.category || '',
      price: product.price,
      min_stock: product.min_stock,
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    try {
      await productsAPI.delete(deleteId)
      toast.success(t('products.deleted'))
      setDeleteId(null)
      loadProducts(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.error || t('products.deleteError'))
    }
  }

  const exportCSV = () => {
    const headers = [t('products.reference'), t('products.name'), t('products.category'), t('products.price'), t('products.stock'), t('products.minStock')]
    const rows = products.map((p) => [
      p.reference, p.name, p.category || '', p.price, p.stock, p.min_stock,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'produits.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && products.length === 0) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadProducts(1)} />
  }

  return (
    <div>
      <PageHeader
        title={t('products.title')}
        actions={
          <>
            <Button variant="secondary" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">{t('common.export')}</span>
            </Button>
            {isAdmin && (
              <Button onClick={() => { resetForm(); setShowModal(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('common.add')}
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4" padding>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </Card>

      <Card padding={false}>
        <div className="table-shell sm:rounded-b-xl">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('products.reference')}</th>
                <th>{t('products.name')}</th>
                <th className="hidden md:table-cell">{t('products.category')}</th>
                <th>{t('products.price')}</th>
                <th>{t('products.stock')}</th>
                <th className="hidden sm:table-cell">{t('products.minStock')}</th>
                {isAdmin && <th>{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {products.map((product) => (
                <tr key={product.id} className={product.stock < product.min_stock ? 'bg-rose-50/50' : ''}>
                  <td className="font-medium text-slate-900">{product.reference}</td>
                  <td className="max-w-[120px] sm:max-w-none truncate">{product.name}</td>
                  <td className="hidden md:table-cell text-slate-500">{product.category || '-'}</td>
                  <td className="font-medium">{formatCurrency(product.price)}</td>
                  <td>
                    <Badge variant={product.stock < product.min_stock ? 'danger' : 'success'}>
                      {product.stock}
                    </Badge>
                  </td>
                  <td className="hidden sm:table-cell text-slate-500">{product.min_stock}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(product)} className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors" aria-label={t('common.edit')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(product.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors" aria-label={t('common.delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <EmptyState
            title={searchTerm ? t('products.noResults') : t('products.noProducts')}
            description={searchTerm ? t('products.tryOtherSearch') : t('products.startAdding')}
            actionLabel={isAdmin && !searchTerm ? t('products.addProduct') : undefined}
            onAction={isAdmin ? () => { resetForm(); setShowModal(true) } : undefined}
          />
        )}

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => { setLoading(true); loadProducts(p) }}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('products.name')} required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label={t('products.reference')} required value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
          <Input label={t('products.category')} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          <Input label={t('products.price')} type="number" step="0.01" min="0" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          <Input label={t('products.minStock')} type="number" min="0" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
          {editingProduct && (
            <div className="bg-slate-50 p-4 rounded-lg border border-surface-border">
              <p className="text-sm text-slate-600">{t('products.currentStock')} : <span className="font-semibold text-slate-900">{editingProduct.stock}</span></p>
              <p className="text-xs text-slate-400 mt-1">{t('products.stockReadonly')}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.loading') : editingProduct ? t('common.edit') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('products.deleteTitle')}
        message={t('products.deleteMessage')}
      />
    </div>
  )
}

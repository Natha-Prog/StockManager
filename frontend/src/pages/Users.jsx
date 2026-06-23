import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usersAPI } from '../api/api'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'

export default function Users() {
  const { t, formatDate } = useSettings()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [formData, setFormData] = useState({ email: '', password: '', role: 'operator' })
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    try {
      setError(null)
      const response = await usersAPI.getAll()
      setUsers(response.data)
    } catch {
      setError(t('users.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await usersAPI.create(formData)
      toast.success(t('users.created'))
      setShowModal(false)
      setFormData({ email: '', password: '', role: 'operator' })
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || t('users.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deleteId)
      toast.success(t('users.deleted'))
      setDeleteId(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || t('users.deleteError'))
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadUsers} />
  }

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('common.add')}
          </Button>
        }
      />

      <Card padding={false}>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('users.email')}</th>
                <th>{t('users.role')}</th>
                <th className="hidden sm:table-cell">{t('users.createdAt')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium text-slate-900 max-w-[180px] truncate">{user.email}</td>
                  <td>
                    <Badge variant={user.role === 'admin' ? 'warning' : 'default'}>
                      {user.role === 'admin' ? t('roles.admin') : t('roles.operator')}
                    </Badge>
                  </td>
                  <td className="hidden sm:table-cell text-slate-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td>
                    <button
                      onClick={() => setDeleteId(user.id)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('users.newUser')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('users.email')} type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label={t('users.password')} type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <Select label={t('users.role')} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="operator">{t('roles.operator')}</option>
            <option value="admin">{t('roles.admin')}</option>
          </Select>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.loading') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('users.deleteTitle')}
        message={t('users.deleteMessage')}
      />
    </div>
  )
}

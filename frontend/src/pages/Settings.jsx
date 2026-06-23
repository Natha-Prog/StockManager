import { useState, useEffect } from 'react'
import { Globe, Coins, Calendar } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'

const settingIcons = {
  language: { icon: Globe, color: 'text-brand-600 bg-brand-50' },
  currency: { icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
  dateFormat: { icon: Calendar, color: 'text-violet-600 bg-violet-50' },
}

function SettingRow({ type, children }) {
  const { icon: Icon, color } = settingIcons[type]
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-surface-border hover:border-slate-300 transition-colors">
      <div className={`shrink-0 p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { settings, t, updateSettings, languages, currencies, dateFormats } = useSettings()
  const toast = useToast()
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({ ...settings })
  }, [settings])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(form)
      toast.success(t('settings.saved'))
    } catch {
      toast.error(t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const lang = form.language || 'fr'

  const previewCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(form.dateFormat, {
        style: 'currency',
        currency: form.currency,
        minimumFractionDigits: form.currency === 'MGA' ? 0 : 2,
        maximumFractionDigits: form.currency === 'MGA' ? 0 : 2,
      }).format(amount)
    } catch {
      return `${amount}`
    }
  }

  const previewDate = (date) => {
    return new Date(date).toLocaleString(form.dateFormat, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-4">
          <Card>
            <SettingRow type="language">
              <Select
                label={t('settings.language')}
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                {Object.entries(languages).map(([code, { label }]) => (
                  <option key={code} value={code}>{label[lang] || label.fr}</option>
                ))}
              </Select>
            </SettingRow>
          </Card>

          <Card>
            <SettingRow type="currency">
              <Select
                label={t('settings.currency')}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {Object.entries(currencies).map(([code, { label }]) => (
                  <option key={code} value={code}>{label[lang] || label.fr}</option>
                ))}
              </Select>
            </SettingRow>
          </Card>

          <Card>
            <SettingRow type="dateFormat">
              <Select
                label={t('settings.dateFormat')}
                value={form.dateFormat}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
              >
                {Object.entries(dateFormats).map(([code, { label }]) => (
                  <option key={code} value={code}>{label[lang] || label.fr}</option>
                ))}
              </Select>
            </SettingRow>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.preview')}</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-surface-border">
              <p className="text-sm text-slate-500">{t('settings.previewPrice')}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{previewCurrency(1234.56)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-surface-border">
              <p className="text-sm text-slate-500">{t('settings.previewDate')}</p>
              <p className="text-lg font-semibold text-slate-900 mt-2">{previewDate(new Date())}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

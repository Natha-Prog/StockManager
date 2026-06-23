import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import Logo from '../components/Logo'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

const REMEMBER_LOGIN_KEY = 'remembered_login'

function loadRememberedLogin() {
  try {
    const stored = localStorage.getItem(REMEMBER_LOGIN_KEY)
    if (!stored) return { email: '', remember: false }
    const data = JSON.parse(stored)
    return {
      email: data.remember ? (data.email || '') : '',
      remember: Boolean(data.remember),
    }
  } catch {
    return { email: '', remember: false }
  }
}

function saveRememberedLogin(email, remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify({ email, remember: true }))
  } else {
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
  }
}

export default function Login() {
  const remembered = loadRememberedLogin()
  const [email, setEmail] = useState(remembered.email)
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(remembered.remember)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, user, loading: authLoading } = useAuth()
  const { t } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const from = location.state?.from?.pathname || '/'

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <Spinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      saveRememberedLogin(email, rememberMe)
      toast.success(t('auth.loginSuccess'))
      navigate(from, { replace: true })
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError(t('auth.serverError'))
      } else {
        setError(t('auth.connectionError'))
      }
    } finally {
      setLoading(false)
    }
  }

  const logoProps = { width: '5.5rem', className: 'drop-shadow-lg' }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-slate-900 via-brand-950 to-brand-800 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-center gap-4">
          <Logo {...logoProps} />
          <span className="text-2xl font-bold text-white">{t('appName')}</span>
        </div>
        <div className="relative space-y-6 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            {t('auth.loginTitle')}
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Gérez vos produits, suivez les mouvements de stock et pilotez votre inventaire en temps réel.
          </p>
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <Shield className="w-5 h-5 text-brand-400" />
            <span>Connexion sécurisée · Accès par rôle</span>
          </div>
        </div>
        <p className="relative text-sm text-slate-500">{t('footer')}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-surface-muted">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <Logo {...logoProps} />
            <span className="text-2xl font-bold text-slate-900">{t('appName')}</span>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">{t('auth.login')}</h1>
              <p className="mt-2 text-sm text-slate-500">{t('auth.loginTitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.email')}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
              <Input
                label={t('auth.password')}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
              />
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-border text-brand-600 focus:ring-brand-500/30"
                />
                <span className="text-sm text-slate-600">{t('auth.rememberMe')}</span>
              </label>
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : t('auth.login')}
              </Button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-6 pt-6 border-t border-surface-border">
              {t('auth.defaultAccount')}
            </p>
          </div>
        </div>

        <p className="lg:hidden text-xs text-slate-400 text-center mt-8 pb-4">{t('footer')}</p>
      </div>
    </div>
  )
}

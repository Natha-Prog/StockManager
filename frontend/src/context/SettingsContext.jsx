import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { settingsAPI } from '../api/api'
import { useAuth } from './AuthContext'
import {
  DEFAULT_SETTINGS,
  getTranslation,
  CURRENCIES,
  DATE_FORMATS,
  LANGUAGES,
} from '../i18n/translations'

const SettingsContext = createContext(null)

const STORAGE_KEY = 'app_settings'

function loadLocalSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language: parsed.language || DEFAULT_SETTINGS.language,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(loadLocalSettings)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadServerSettings = async () => {
      try {
        const response = await settingsAPI.get()
        const merged = { ...DEFAULT_SETTINGS, ...response.data }
        setSettings(merged)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // Use local settings if server unavailable
      }
    }
    loadServerSettings()
  }, [user])

  const language = user ? settings.language : DEFAULT_SETTINGS.language

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = useCallback(
    (key) => getTranslation(language, key),
    [language]
  )

  const formatCurrency = useCallback(
    (amount) => {
      const currency = settings.currency || 'EUR'
      try {
        return new Intl.NumberFormat(settings.dateFormat || 'fr-FR', {
          style: 'currency',
          currency,
          minimumFractionDigits: currency === 'MGA' ? 0 : 2,
          maximumFractionDigits: currency === 'MGA' ? 0 : 2,
        }).format(amount ?? 0)
      } catch {
        return `${Number(amount ?? 0).toFixed(2)} ${CURRENCIES[currency]?.symbol || currency}`
      }
    },
    [settings.currency, settings.dateFormat]
  )

  const formatDate = useCallback(
    (date, options = {}) => {
      if (!date) return '-'
      const d = new Date(date)
      const defaults = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
      }
      if (!options.hour && !options.minute) {
        return d.toLocaleDateString(settings.dateFormat, defaults)
      }
      return d.toLocaleString(settings.dateFormat, {
        ...defaults,
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    [settings.dateFormat]
  )

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

    if (user) {
      try {
        await settingsAPI.update(merged)
      } catch {
        throw new Error('save_failed')
      }
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        t,
        formatCurrency,
        formatDate,
        updateSettings,
        currencies: CURRENCIES,
        dateFormats: DATE_FORMATS,
        languages: LANGUAGES,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

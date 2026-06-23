import { useSettings } from '../../context/SettingsContext'
import Button from './Button'

export default function ErrorState({ message, onRetry }) {
  const { t } = useSettings()

  return (
    <div className="card text-center py-14 px-6">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
        <span className="text-rose-500 text-xl font-bold">!</span>
      </div>
      <p className="text-rose-600 font-medium">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-5">{t('common.retry')}</Button>
      )}
    </div>
  )
}

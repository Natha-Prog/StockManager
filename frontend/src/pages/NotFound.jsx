import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import Button from '../components/ui/Button'

export default function NotFound() {
  const { t } = useSettings()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold text-slate-200">404</p>
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-700 mt-4">{t('notFound.title')}</h1>
      <Link to="/" className="inline-block mt-8">
        <Button size="lg">{t('notFound.back')}</Button>
      </Link>
    </div>
  )
}

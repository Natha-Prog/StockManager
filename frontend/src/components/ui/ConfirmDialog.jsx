import { useSettings } from '../../context/SettingsContext'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel, variant = 'danger' }) {
  const { t } = useSettings()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmLabel || t('common.confirm')}</Button>
      </div>
    </Modal>
  )
}

import Button from './Button'

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-dashed" />
      </div>
      <p className="text-slate-900 font-semibold">{title}</p>
      {description && <p className="text-slate-500 mt-1.5 text-sm max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5">{actionLabel}</Button>
      )}
    </div>
  )
}

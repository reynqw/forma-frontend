import { useState } from 'react'
import { X } from 'lucide-react'

interface RejectModalProps {
  title: string
  onConfirm: (reason: string) => void
  onClose: () => void
}

export default function RejectModal({ title, onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-card-xl w-full max-w-md p-6 modal-content">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-200 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Укажите причину отклонения..."
          className="input min-h-[100px] resize-none mb-4"
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            Отмена
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()) }}
            disabled={!reason.trim()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}

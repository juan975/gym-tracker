import type { ReactNode } from 'react'
import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  icon: ReactNode
  title: string
  message: ReactNode
  confirmText: string
  cancelText?: string
  destructive?: boolean
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  icon,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  destructive = false
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex justify-center mb-4">
        <div className="neu-inset w-14 h-14 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-center text-slate-700 font-bold text-lg mb-2">
        {title}
      </h3>
      <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
        {message}
      </p>

      {cancelText && (
        <button
          onClick={onClose}
          className="neu-raised w-full p-4 mb-3 text-slate-700 font-semibold text-sm"
        >
          {cancelText}
        </button>
      )}
      <button
        onClick={onConfirm}
        className={`neu-button w-full py-3 text-sm font-medium ${
          destructive ? 'text-red-500' : 'text-slate-700'
        }`}
      >
        {confirmText}
      </button>
    </Modal>
  )
}

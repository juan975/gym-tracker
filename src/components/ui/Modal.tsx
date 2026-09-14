import type { ReactNode } from 'react'
import { THEME } from '../../constants'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'center' | 'bottom'
  maxHeight?: string
}

export default function Modal({ open, onClose, children, align = 'center', maxHeight }: ModalProps) {
  if (!open) return null

  return (
    <div 
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center p-4 sm:items-center ${
        align === 'bottom' ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-sm p-6 rounded-3xl ${maxHeight ? 'overflow-y-auto' : ''}`}
        style={{ ...THEME.neuBgStyle, maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

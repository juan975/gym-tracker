import type { ReactNode } from 'react'
import UserMenu from './UserMenu'
import { usePreferencias } from '../context/PreferenciasContext'
import { useAuth } from '../context/AuthContext'

interface PageHeaderProps {
  titulo: string
  mostrarBienvenida?: boolean
  subtituloOpcional?: string
  rightElement?: ReactNode
}

export default function PageHeader({ 
  titulo, 
  mostrarBienvenida = false, 
  subtituloOpcional,
  rightElement 
}: PageHeaderProps) {
  const { preferencias } = usePreferencias()
  const { perfil } = useAuth()
  
  const nombre = preferencias?.nombre || perfil?.nombre || ''
  
  const subtitle = mostrarBienvenida 
    ? `Bienvenido, ${nombre}` 
    : subtituloOpcional

  return (
    <div className="flex items-center justify-between mb-8 pt-6">
      <div className="flex items-center gap-4">
        <UserMenu />
        <div>
          {subtitle && (
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl font-bold text-slate-700 mt-1">{titulo}</h1>
        </div>
      </div>
      {rightElement && (
        <div className="flex items-center gap-3">
          {rightElement}
        </div>
      )}
    </div>
  )
}

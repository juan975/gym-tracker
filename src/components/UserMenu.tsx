import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePreferencias } from '../context/PreferenciasContext'
import { cerrarSesion } from '../firebase/auth'

export default function UserMenu() {
  const { user, perfil } = useAuth()
  const { preferencias } = usePreferencias()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al tocar fuera
  useEffect(() => {
    if (!abierto) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    // Delay para evitar que el click que abre también cierre
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [abierto])

  const nombre = preferencias?.nombre || perfil?.nombre || ''
  const apellido = preferencias?.apellido || perfil?.apellido || ''
  const email = user?.email || ''
  const iniciales = (nombre[0] || '') + (apellido[0] || '')

  const handleCerrarSesion = async () => {
    setAbierto(false)
    await cerrarSesion()
  }

  return (
    <div className="relative">
      {/* Avatar */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="neu-button w-10 h-10 flex items-center justify-center"
      >
        {iniciales ? (
          <span className="text-xs font-bold text-slate-600 uppercase">{iniciales}</span>
        ) : (
          <User size={18} className="text-slate-500" />
        )}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <>
          {/* Overlay para cerrar en mobile */}
          <div className="fixed inset-0 z-40" />
          
          <div
            ref={panelRef}
            className="absolute left-0 top-14 z-50 w-64 neu-raised p-5 animate-in fade-in slide-in-from-top-2"
          >
            {/* Info del usuario */}
            <div className="mb-4 pb-4 border-b border-slate-300/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="neu-inset w-11 h-11 flex items-center justify-center shrink-0">
                  {iniciales ? (
                    <span className="text-sm font-bold text-slate-600 uppercase">{iniciales}</span>
                  ) : (
                    <User size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {nombre} {apellido}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-1">
              <button
                onClick={() => { setAbierto(false); navigate('/ajustes') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 font-medium hover:bg-slate-200/50 transition-colors"
              >
                <Settings size={16} className="text-slate-500" />
                Ajustes
              </button>
              <button
                onClick={handleCerrarSesion}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

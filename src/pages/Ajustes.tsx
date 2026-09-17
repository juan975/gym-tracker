import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, X, Save, Sun, Moon, Pill, Lock } from 'lucide-react'
import { usePreferencias } from '../context/PreferenciasContext'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'

export default function Ajustes() {
  const navigate = useNavigate()
  const { preferencias, actualizarPreferencias } = usePreferencias()
  const { user } = useAuth()
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)

  // Campos editables (estado local durante edición del perfil)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')

  const iniciarEdicion = () => {
    if (!preferencias) return
    setNombre(preferencias.nombre)
    setApellido(preferencias.apellido)
    setEditando(true)
  }

  const handleToggleTema = (nuevoTema: 'claro' | 'oscuro') => {
    if (preferencias?.tema !== nuevoTema) {
      actualizarPreferencias({ tema: nuevoTema })
    }
  }

  const handleToggleSeccion = (seccion: 'creatina' | 'historial', valor: boolean) => {
    if (!preferencias) return
    actualizarPreferencias({
      secciones: {
        ...preferencias.secciones,
        [seccion]: valor
      }
    })
  }

  const cancelarEdicion = () => {
    setEditando(false)
  }

  const guardar = async () => {
    if (!nombre.trim() || !apellido.trim()) return
    setCargando(true)
    await actualizarPreferencias({
      nombre: nombre.trim(),
      apellido: apellido.trim()
    })
    setCargando(false)
    setEditando(false)
  }

  if (!preferencias) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="neu-button p-3">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <UserMenu />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-700">Ajustes</h1>
        </div>
        {!editando ? (
          <button onClick={iniciarEdicion} className="neu-button p-3">
            <Edit size={18} className="text-slate-600" />
          </button>
        ) : (
          <button onClick={cancelarEdicion} className="neu-button p-3">
            <X size={18} className="text-slate-600" />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Perfil */}
        <div className="neu-raised p-5">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Perfil</h2>
          
          {editando ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full neu-inset px-4 py-2.5 text-sm text-slate-700 outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full neu-inset px-4 py-2.5 text-sm text-slate-700 outline-none bg-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Nombre</span>
                <span className="text-sm font-medium text-slate-700">{preferencias.nombre} {preferencias.apellido}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-sm font-medium text-slate-700 truncate ml-4">{user?.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tema */}
        <div className="neu-raised p-5">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Apariencia</h2>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleToggleTema('claro')}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2 ${
                preferencias.tema === 'claro'
                  ? 'neu-active text-slate-700'
                  : 'neu-button text-slate-500'
              }`}
            >
              <Sun size={16} />
              Claro
            </button>
            <button
              type="button"
              onClick={() => handleToggleTema('oscuro')}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2 ${
                preferencias.tema === 'oscuro'
                  ? 'neu-active text-slate-700'
                  : 'neu-button text-slate-500'
              }`}
            >
              <Moon size={16} />
              Oscuro
            </button>
          </div>
        </div>

        {/* Secciones */}
        <div className="neu-raised p-5">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Secciones visibles</h2>
          
          <div className="space-y-4">
            {/* Creatina */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-slate-500" />
                <span className="text-sm text-slate-700 font-medium">Creatina</span>
              </div>
              <button
                onClick={() => handleToggleSeccion('creatina', !preferencias.secciones.creatina)}
                className={`w-12 h-7 rounded-full transition-all relative ${
                  preferencias.secciones.creatina ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${
                  preferencias.secciones.creatina ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Historial */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                  <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                </svg>
                <span className="text-sm text-slate-700 font-medium">Historial</span>
              </div>
              <button
                onClick={() => handleToggleSeccion('historial', !preferencias.secciones.historial)}
                className={`w-12 h-7 rounded-full transition-all relative ${
                  preferencias.secciones.historial ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${
                  preferencias.secciones.historial ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="neu-raised p-5">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Seguridad</h2>
          
          <button
            onClick={() => navigate('/cambiar-password')}
            className="neu-button w-full py-3.5 text-sm font-medium text-slate-700 flex items-center justify-center gap-2"
          >
            <Lock size={16} className="text-slate-500" />
            Cambiar contraseña
          </button>
        </div>

        {/* Botón guardar (solo en modo edición) */}
        {editando && (
          <button
            onClick={guardar}
            disabled={cargando}
            className="w-full neu-button py-3.5 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <>
                <Save size={16} />
                Guardar cambios
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

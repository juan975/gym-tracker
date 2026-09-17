import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Lock } from 'lucide-react'
import { actualizarPassword } from '../firebase/auth'

export default function CambiarPassword() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setExito(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, completa todos los campos.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.')
      return
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    try {
      setCargando(true)
      await actualizarPassword(currentPassword, newPassword)
      setExito(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Regresar después de un momento
      setTimeout(() => navigate('/ajustes'), 2000)
    } catch (err: any) {
      console.error(err)
      if (err.code === 'auth/invalid-credential') {
        setError('La contraseña actual es incorrecta.')
      } else if (err.code === 'auth/user-mismatch') {
        setError('Las credenciales no coinciden.')
      } else {
        setError('Error al actualizar la contraseña. Revisa tus credenciales o intenta iniciar sesión de nuevo.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="neu-button p-3">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-700">Cambiar Contraseña</h1>
        </div>
      </div>

      <div className="neu-raised p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center">
            <Lock size={32} className="text-slate-500" />
          </div>
        </div>

        {exito && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 text-sm font-medium text-center border border-green-200">
            ¡Contraseña actualizada correctamente! Redirigiendo...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={cargando || exito}
              className="w-full neu-inset px-4 py-3.5 text-sm text-slate-700 outline-none bg-transparent"
              placeholder="Ingresa tu contraseña actual"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={cargando || exito}
              className="w-full neu-inset px-4 py-3.5 text-sm text-slate-700 outline-none bg-transparent"
              placeholder="Ingresa tu nueva contraseña"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={cargando || exito}
              className="w-full neu-inset px-4 py-3.5 text-sm text-slate-700 outline-none bg-transparent"
              placeholder="Repite tu nueva contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={cargando || exito}
            className="w-full neu-active py-4 mt-2 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Actualizando...
              </span>
            ) : (
              <>
                <Save size={18} />
                Guardar nueva contraseña
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { firestore } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { Pill, Sun, Moon, ChevronRight } from 'lucide-react'

export default function Onboarding() {
  const { user, refrescarPerfil } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [tomaSuplemento, setTomaSuplemento] = useState(false)
  const [tema, setTema] = useState<'claro' | 'oscuro'>('claro')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('Ingresa tu nombre')
      return
    }
    if (!apellido.trim()) {
      setError('Ingresa tu apellido')
      return
    }

    if (!user) return

    setCargando(true)
    setError('')

    try {
      const configRef = doc(firestore, 'users', user.uid, 'preferencias', 'config')
      await setDoc(configRef, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: user.email || '',
        tema,
        secciones: {
          creatina: tomaSuplemento,
          historial: true,
        },
        creadoEn: new Date().toISOString(),
      })

      await refrescarPerfil()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Error guardando perfil:', err)
      setError('Error al guardar. Intenta de nuevo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-700">¡Bienvenido!</h1>
          <p className="text-sm text-slate-500 mt-1">Personaliza tu experiencia</p>
        </div>

        {/* Error */}
        {error && (
          <div className="neu-inset px-4 py-3 mb-5 text-center">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError('') }}
              placeholder="Tu nombre"
              className="w-full neu-inset px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => { setApellido(e.target.value); setError('') }}
              placeholder="Tu apellido"
              className="w-full neu-inset px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Suplemento */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3 ml-1">
              ¿Tomas algún suplemento?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTomaSuplemento(true)}
                className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  tomaSuplemento
                    ? 'neu-active text-slate-700'
                    : 'neu-button text-slate-500'
                }`}
              >
                <Pill size={16} />
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTomaSuplemento(false)}
                className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all ${
                  !tomaSuplemento
                    ? 'neu-active text-slate-700'
                    : 'neu-button text-slate-500'
                }`}
              >
                No
              </button>
            </div>
            {tomaSuplemento && (
              <p className="text-xs text-slate-400 mt-2 ml-1">
                Se habilitará el seguimiento de creatina
              </p>
            )}
          </div>

          {/* Tema */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3 ml-1">Tema</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTema('claro')}
                className={`flex-1 py-3.5 text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  tema === 'claro'
                    ? 'neu-active text-slate-700'
                    : 'neu-button text-slate-500'
                }`}
              >
                <Sun size={16} />
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTema('oscuro')}
                className={`flex-1 py-3.5 text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  tema === 'oscuro'
                    ? 'neu-active text-slate-700'
                    : 'neu-button text-slate-500'
                }`}
              >
                <Moon size={16} />
                Oscuro
              </button>
            </div>
          </div>

          {/* Botón continuar */}
          <button
            onClick={handleGuardar}
            disabled={cargando}
            className="w-full neu-button py-3.5 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4"
          >
            {cargando ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <>
                Empezar
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

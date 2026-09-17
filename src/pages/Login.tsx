import { useState } from 'react'
import { registrarse, iniciarSesion, iniciarSesionGoogle } from '../firebase/auth'

export default function Login() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const limpiarError = () => setError('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos')
      return
    }

    if (esRegistro && password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)
    try {
      if (esRegistro) {
        await registrarse(email, password)
      } else {
        await iniciarSesion(email, password)
      }
      // El AuthContext detecta el cambio y redirige automáticamente
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado')
      } else if (code === 'auth/invalid-email') {
        setError('Email inválido')
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos')
      } else if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde')
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo')
      }
    } finally {
      setCargando(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setCargando(true)
    try {
      await iniciarSesionGoogle()
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Error con Google. Intenta de nuevo')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Título */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-5">
            <img src="/pwa-192x192.png" alt="Gym Tracker Logo" className="logo-light w-20 h-20 object-contain drop-shadow-xl rounded-[1.25rem] overflow-hidden" />
            <img src="/pwa-192x192-dark.png.png" alt="Gym Tracker Logo" className="logo-dark w-20 h-20 object-contain drop-shadow-xl rounded-[1.25rem] overflow-hidden" />
          </div>
          <h1 className="text-2xl font-bold text-slate-700">Gym Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            {esRegistro ? 'Crea tu cuenta' : 'Inicia sesión'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="neu-inset px-4 py-3 mb-5 text-center">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); limpiarError() }}
              placeholder="tu@email.com"
              className="w-full neu-inset px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); limpiarError() }}
              placeholder="••••••••"
              className="w-full neu-inset px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
            />
          </div>

          {esRegistro && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); limpiarError() }}
                placeholder="••••••••"
                className="w-full neu-inset px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full neu-button py-3.5 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {cargando ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Cargando...
              </span>
            ) : esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-300" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={cargando}
          className="w-full neu-button py-3.5 text-sm font-medium text-slate-700 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        {/* Toggle login/registro */}
        <p className="text-center text-sm text-slate-500 mt-8">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => { setEsRegistro(!esRegistro); setError(''); setConfirmPassword('') }}
            className="font-semibold text-slate-700 underline underline-offset-2"
          >
            {esRegistro ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferenciasProvider } from './context/PreferenciasContext'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Rutinas from './pages/Rutinas'
import RutinaDetalle from './pages/RutinaDetalle'
import SesionActiva from './pages/SesionActiva'
import Historial from './pages/Historial'
import EditarRutina from './pages/EditarRutina'
import Estadisticas from './pages/Estadisticas'
import CreatinaSeguimiento from './pages/CreatinaSeguimiento'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Ajustes from './pages/Ajustes'
import CambiarPassword from './pages/CambiarPassword'

function AppRoutes() {
  const { user, loading, perfilCompleto } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="neu-raised w-16 h-16 flex items-center justify-center">
            <span className="text-2xl">🏋️</span>
          </div>
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // No autenticado → login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Autenticado pero sin onboarding → onboarding
  if (!perfilCompleto) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  // Autenticado y con perfil completo → app normal
  return (
    <PreferenciasProvider>
      <Routes>
        {/* Sesión activa: full-screen, sin navbar */}
        <Route path="/sesion/:rutinaId" element={<SesionActiva />} />

        {/* Páginas con navbar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="rutinas" element={<Rutinas />} />
          <Route path="rutina/:id" element={<RutinaDetalle />} />
          <Route path="historial" element={<Historial />} />
          <Route path="rutina/:id/editar" element={<EditarRutina />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="creatina" element={<CreatinaSeguimiento />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="cambiar-password" element={<CambiarPassword />} />
        </Route>

        {/* Rutas de auth redirigen a home si ya está logueado */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
      </Routes>
    </PreferenciasProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
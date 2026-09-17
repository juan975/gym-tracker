import { NavLink, Outlet } from 'react-router-dom'
import { Home, Dumbbell, History, BarChart3, Pill } from 'lucide-react'
import { usePreferencias } from '../context/PreferenciasContext'

export default function Layout() {
  const { preferencias } = usePreferencias()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-3 mx-1 my-2 text-[10px] font-medium rounded-2xl transition-all ${
      isActive 
        ? 'neu-active text-slate-700' 
        : 'text-slate-500'
    }`

  // Tabs que siempre se muestran
  const tabs = [
    { to: '/', icon: Home, label: 'Hoy', end: true },
    { to: '/rutinas', icon: Dumbbell, label: 'Rutinas' },
    { to: '/estadisticas', icon: BarChart3, label: 'Stats' },
  ]

  // Tabs opcionales según preferencias
  if (preferencias?.secciones.historial !== false) {
    tabs.push({ to: '/historial', icon: History, label: 'Historial' })
  }
  if (preferencias?.secciones.creatina !== false) {
    tabs.push({ to: '/creatina', icon: Pill, label: 'Creatina' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <nav className="fixed bottom-4 left-4 right-4 neu-raised flex px-1">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={linkClass} end={tab.end}>
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
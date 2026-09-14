import { NavLink, Outlet } from 'react-router-dom'
import { Home, Dumbbell, History, BarChart3, Pill } from 'lucide-react'

export default function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-3 mx-1 my-2 text-[10px] font-medium rounded-2xl transition-all ${
      isActive 
        ? 'neu-active text-slate-700' 
        : 'text-slate-500'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <nav className="fixed bottom-4 left-4 right-4 neu-raised flex px-1">
        <NavLink to="/" className={linkClass} end>
          <Home size={18} />
          <span>Hoy</span>
        </NavLink>
        <NavLink to="/rutinas" className={linkClass}>
          <Dumbbell size={18} />
          <span>Rutinas</span>
        </NavLink>
        <NavLink to="/estadisticas" className={linkClass}>
          <BarChart3 size={18} />
          <span>Stats</span>
        </NavLink>
        <NavLink to="/historial" className={linkClass}>
          <History size={18} />
          <span>Historial</span>
        </NavLink>
        <NavLink to="/creatina" className={linkClass}>
          <Pill size={18} />
          <span>Creatina</span>
        </NavLink>
      </nav>
    </div>
  )
}
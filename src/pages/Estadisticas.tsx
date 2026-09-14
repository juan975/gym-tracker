import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, Calendar, TrendingUp } from 'lucide-react'
import { db } from '../db/database'
import { useEstadisticas } from '../hooks/useEstadisticas'
import ProgresionFuerza from '../components/estadisticas/ProgresionFuerza'

export default function Estadisticas() {
  const {
    diasEntrenadosSize,
    racha,
    resumenSemana,
    semanaCompletas,
    semanaPlaneadas
  } = useEstadisticas()

  // Queries necesarias solo para la gráfica
  const sesiones = useLiveQuery(async () => {
    const todas = await db.sesiones.toArray()
    return todas.filter(s => s.completada === true)
  })
  const sets = useLiveQuery(() => db.setsRegistrados.toArray())
  const ejercicios = useLiveQuery(() => db.ejercicios.toArray())
  const rutinas = useLiveQuery(() => db.rutinas.toArray())

  return (
    <div className="p-6">
      <div className="mb-8 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Progreso</p>
        <h1 className="text-3xl font-bold text-slate-700 mt-1">Estadísticas</h1>
      </div>

      {/* KPIs superiores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Racha</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">{racha}</p>
          <p className="text-xs text-slate-500 mt-1">
            {racha === 1 ? 'día' : 'días'} seguidos
          </p>
        </div>

        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-blue-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">{diasEntrenadosSize}</p>
          <p className="text-xs text-slate-500 mt-1">
            días entrenados
          </p>
        </div>
      </div>

      {/* Resumen semana */}
      <div className="neu-raised p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Esta semana</p>
            <p className="text-slate-700 font-bold text-lg mt-0.5">
              {semanaCompletas} / {semanaPlaneadas}
              <span className="text-slate-500 text-sm font-medium ml-1">sesiones</span>
            </p>
          </div>
          <div className="neu-inset px-3 py-1.5 rounded-full">
            <span className="text-slate-700 font-semibold text-xs">
              {semanaPlaneadas > 0 ? Math.round(semanaCompletas / semanaPlaneadas * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {resumenSemana.map((dia, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className={`w-full h-14 rounded-xl flex items-center justify-center transition-all ${
                  dia.completado 
                    ? 'neu-raised' 
                    : dia.esFuturo 
                      ? 'neu-inset opacity-40' 
                      : 'neu-inset'
                }`}
              >
                {dia.completado && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                )}
                {dia.esHoy && !dia.completado && (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse"></div>
                )}
              </div>
              <span className={`text-xs font-semibold ${
                dia.esHoy ? 'text-slate-700' : 'text-slate-500'
              }`}>
                {dia.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progresión de fuerza */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-slate-600" />
          <h2 className="text-slate-700 font-bold text-lg">Progresión de fuerza</h2>
        </div>

        <ProgresionFuerza 
          sets={sets ?? []} 
          ejercicios={ejercicios ?? []} 
          rutinas={rutinas ?? []}
          sesiones={sesiones ?? []}
        />
      </div>

      {/* Si no hay datos */}
      {diasEntrenadosSize === 0 && (
        <div className="neu-inset p-8 text-center">
          <p className="text-slate-500 text-sm leading-relaxed">
            Aún no tienes sesiones completadas.<br/>
            Empieza a entrenar y aquí verás tu progreso.
          </p>
        </div>
      )}
    </div>
  )
}
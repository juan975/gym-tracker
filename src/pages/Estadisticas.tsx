import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, Calendar, TrendingUp, ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { db } from '../db/database'

export default function Estadisticas() {
  const sesiones = useLiveQuery(async () => {
    const todas = await db.sesiones.toArray()
    return todas.filter(s => s.completada === true)
  })
  const sets = useLiveQuery(() => db.setsRegistrados.toArray())
  const ejercicios = useLiveQuery(() => db.ejercicios.toArray())
  const rutinas = useLiveQuery(() => db.rutinas.toArray())

  // ==== MÉTRICAS ====

  // Días únicos entrenados
  const diasEntrenados = useMemo(() => {
    if (!sesiones) return new Set<string>()
    return new Set(
      sesiones.map(s => new Date(s.fecha).toISOString().split('T')[0])
    )
  }, [sesiones])

  // Racha actual (días consecutivos de entrenamiento, contando semana)
  const racha = useMemo(() => {
    if (diasEntrenados.size === 0) return 0
    let contador = 0
    const hoy = new Date()
    for (let i = 0; i < 365; i++) {
      const dia = new Date(hoy)
      dia.setDate(hoy.getDate() - i)
      const iso = dia.toISOString().split('T')[0]
      const diaSemana = dia.getDay()
      // Los domingos/sábados son descanso, no rompen la racha
      if (diaSemana === 0 || diaSemana === 6) continue
      if (diasEntrenados.has(iso)) contador++
      else break
    }
    return contador
  }, [diasEntrenados])

  // Resumen de la semana actual
  const resumenSemana = useMemo(() => {
    const hoy = new Date()
    const diaSemanaHoy = hoy.getDay()
    // Lunes de esta semana
    const lunes = new Date(hoy)
    const diff = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy
    lunes.setDate(hoy.getDate() + diff)
    lunes.setHours(0, 0, 0, 0)

    const dias = [1, 2, 3, 4, 5] // Lun-Vie (planeados)
    const resultado = dias.map(offset => {
      const dia = new Date(lunes)
      dia.setDate(lunes.getDate() + offset - 1)
      const iso = dia.toISOString().split('T')[0]
      const esHoy = iso === hoy.toISOString().split('T')[0]
      const esFuturo = dia > hoy && !esHoy
      return {
        nombre: ['L', 'M', 'X', 'J', 'V'][offset - 1],
        completado: diasEntrenados.has(iso),
        esFuturo,
        esHoy
      }
    })
    return resultado
  }, [diasEntrenados])

  const semanaCompletas = resumenSemana.filter(d => d.completado).length
  const semanaPlaneadas = resumenSemana.filter(d => !d.esFuturo).length

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
          <p className="text-3xl font-bold text-slate-700">{diasEntrenados.size}</p>
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
      {diasEntrenados.size === 0 && (
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

// === Componente de progresión ===
function ProgresionFuerza({ 
  sets, 
  ejercicios,
  rutinas,
  sesiones
}: { 
  sets: any[]
  ejercicios: any[]
  rutinas: any[]
  sesiones: any[]
}) {
  const [ejercicioId, setEjercicioId] = useState<number | null>(null)
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  // Ejercicios que tienen al menos un set registrado
  const ejerciciosConDatos = useMemo(() => {
    const idsConSets = new Set(sets.filter(s => s.completado && s.peso > 0).map(s => s.ejercicioId))
    return ejercicios.filter(e => idsConSets.has(e.id))
  }, [ejercicios, sets])

  // Seleccionar primero por defecto
  const idActivo = ejercicioId ?? ejerciciosConDatos[0]?.id ?? null
  const ejercicioActivo = ejercicios.find(e => e.id === idActivo)
  const rutinaActiva = rutinas.find(r => r.id === ejercicioActivo?.rutinaId)

  // Datos de la gráfica: volumen (peso × reps) sumado por sesión
  const datosGrafica = useMemo(() => {
    if (!idActivo) return []
    const setsDelEjercicio = sets.filter(s => 
      s.ejercicioId === idActivo && s.completado && s.peso > 0
    )

    // Agrupar por sesión
    const porSesion = new Map<number, number>()
    setsDelEjercicio.forEach(s => {
      const vol = s.peso * s.reps
      porSesion.set(s.sesionId, (porSesion.get(s.sesionId) ?? 0) + vol)
    })

    // Convertir a array con fecha
    return Array.from(porSesion.entries())
      .map(([sesionId, volumen]) => {
        const sesion = sesiones.find(s => s.id === sesionId)
        return {
          sesionId,
          fecha: sesion ? new Date(sesion.fecha) : new Date(),
          volumen
        }
      })
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .map(d => ({
        fecha: d.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        volumen: Math.round(d.volumen)
      }))
  }, [sets, sesiones, idActivo])

  if (ejerciciosConDatos.length === 0) {
    return (
      <div className="neu-inset p-6 text-center">
        <p className="text-slate-500 text-sm">
          Completa algunos sets para ver tu progresión.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Selector de ejercicio */}
      <button
        onClick={() => setSelectorAbierto(true)}
        className="neu-raised w-full p-4 mb-4 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {rutinaActiva?.dia}
          </p>
          <p className="text-slate-700 font-semibold text-sm mt-0.5 truncate">
            {ejercicioActivo?.nombre}
          </p>
        </div>
        <ChevronDown size={20} className="text-slate-500 shrink-0 ml-2" />
      </button>

      {/* Gráfica */}
      <div className="neu-raised p-4">
        {datosGrafica.length < 2 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            Necesitas al menos 2 sesiones para ver la progresión.
          </p>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-3 text-center">
              Volumen total (kg × reps)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datosGrafica} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8cdd4" />
                <XAxis 
                  dataKey="fecha" 
                  stroke="#8a94a6" 
                  fontSize={11}
                  tick={{ fill: '#8a94a6' }}
                />
                <YAxis 
                  stroke="#8a94a6" 
                  fontSize={11}
                  tick={{ fill: '#8a94a6' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#e0e5ec',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '4px 4px 8px #b8bcc2, -4px -4px 8px #ffffff'
                  }}
                  labelStyle={{ color: '#475569', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volumen" 
                  stroke="#475569" 
                  strokeWidth={3}
                  dot={{ fill: '#475569', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Modal selector */}
      {selectorAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectorAbierto(false)}
        >
          <div 
            className="w-full max-w-sm p-6 rounded-3xl max-h-[70vh] overflow-y-auto"
            style={{ backgroundColor: '#e0e5ec' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center text-slate-700 font-bold text-lg mb-4">
              Elegir ejercicio
            </h3>
            <div className="space-y-2">
              {ejerciciosConDatos.map(ej => {
                const rut = rutinas.find(r => r.id === ej.rutinaId)
                return (
                  <button
                    key={ej.id}
                    onClick={() => { setEjercicioId(ej.id); setSelectorAbierto(false) }}
                    className={`w-full p-3 rounded-2xl text-left transition-all ${
                      ej.id === idActivo ? 'neu-active' : 'neu-raised'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      {rut?.dia}
                    </p>
                    <p className="text-slate-700 font-semibold text-sm mt-0.5">
                      {ej.nombre}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
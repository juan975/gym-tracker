import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Modal from '../ui/Modal'

export default function ProgresionFuerza({ 
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
      <Modal open={selectorAbierto} onClose={() => setSelectorAbierto(false)} maxHeight="70vh">
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
      </Modal>
    </>
  )
}

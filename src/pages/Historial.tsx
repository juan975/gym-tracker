import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Dumbbell, Trash2, AlertTriangle, ArrowLeft, Trophy } from 'lucide-react'
import { db } from '../db/database'

export default function Historial() {
  // Todas las sesiones
  const sesiones = useLiveQuery(() => db.sesiones.toArray())
  const rutinas = useLiveQuery(() => db.rutinas.toArray())
  const sets = useLiveQuery(() => db.setsRegistrados.toArray())
  const ejercicios = useLiveQuery(() => db.ejercicios.toArray())
  const ejerciciosSesion = useLiveQuery(() => db.ejerciciosSesion.toArray())

  // Limpiar sesiones huérfanas (no completadas, con más de 24h)
  useEffect(() => {
    const limpiarHuerfanas = async () => {
      const todas = await db.sesiones.toArray()
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const huerfanas = todas.filter(
        s => !s.completada && new Date(s.fecha) < hace24h
      )
      if (huerfanas.length > 0) {
        const ids = huerfanas.map(s => s.id!).filter(Boolean)
        await db.transaction('rw', db.sesiones, db.setsRegistrados, db.ejerciciosSesion, async () => {
          for (const id of ids) {
            await db.setsRegistrados.where('sesionId').equals(id).delete()
            await db.ejerciciosSesion.where('sesionId').equals(id).delete()
          }
          await db.sesiones.bulkDelete(ids)
        })
      }
    }
    limpiarHuerfanas()
  }, [])

  // Solo sesiones completadas, ordenadas por fecha descendente
  const sesionesCompletadas = useMemo(() => {
    if (!sesiones) return []
    return sesiones
      .filter(s => s.completada === true)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [sesiones])

  // Sesión seleccionada para ver detalle completo
  const [sesionDetalle, setSesionDetalle] = useState<number | null>(null)

  // Modal de confirmación de borrado
  const [confirmarBorrado, setConfirmarBorrado] = useState<number | null>(null)

  const borrarSesion = async (sesionId: number) => {
    await db.transaction('rw', db.sesiones, db.setsRegistrados, db.ejerciciosSesion, async () => {
      await db.setsRegistrados.where('sesionId').equals(sesionId).delete()
      await db.ejerciciosSesion.where('sesionId').equals(sesionId).delete()
      await db.sesiones.delete(sesionId)
    })
    setConfirmarBorrado(null)
    if (sesionDetalle === sesionId) setSesionDetalle(null)
  }

  if (!sesiones || !rutinas || !sets || !ejercicios) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  // ---- Vista de detalle de una sesión ----
  if (sesionDetalle !== null) {
    const sesion = sesionesCompletadas.find(s => s.id === sesionDetalle)
    if (!sesion) {
      setSesionDetalle(null)
      return null
    }

    const rutina = rutinas.find(r => r.id === sesion.rutinaId)
    const setsDeEstaSesion = sets.filter(s => s.sesionId === sesion.id)
    const ejerciciosFuente = sesion.personalizada
      ? (ejerciciosSesion ?? []).filter(e => e.sesionId === sesion.id)
      : (ejercicios ?? []).filter(e => e.rutinaId === sesion.rutinaId)

    const fecha = new Date(sesion.fecha)
    const fechaStr = fecha.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    })

    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8 pt-6">
          <button onClick={() => setSesionDetalle(null)} className="neu-button p-3">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
              {fechaStr}
            </p>
            <h1 className="text-2xl font-bold text-slate-700 mt-1 leading-tight">
              {rutina?.grupoMuscular ?? 'Rutina eliminada'}
            </h1>
          </div>
        </div>

        <div className="space-y-5">
          {ejerciciosFuente.map(ej => {
            const setsDelEjercicio = setsDeEstaSesion
              .filter(s => s.ejercicioId === ej.id)
              .sort((a, b) => a.numeroSet - b.numeroSet)

            if (setsDelEjercicio.length === 0) return null

            return (
              <div key={ej.id} className="neu-raised p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={16} className="text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {ej.nombre}
                  </h3>
                </div>
                <div className="space-y-2">
                  {setsDelEjercicio.map(set => (
                    <div
                      key={set.id}
                      className="neu-inset px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-xs font-medium text-slate-500 w-12">
                        Set {set.numeroSet}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {set.peso > 0 ? `${set.peso} kg` : '—'}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {set.reps > 0 ? `${set.reps} reps` : '—'}
                      </span>
                      <span className={`text-xs font-semibold ${set.completado ? 'text-green-600' : 'text-slate-400'}`}>
                        {set.completado ? '✓' : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- Vista de lista ----
  return (
    <div className="p-6">
      <div className="mb-8 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Progreso</p>
        <h1 className="text-3xl font-bold text-slate-700 mt-1">Historial</h1>
      </div>

      {sesionesCompletadas.length === 0 ? (
        <div className="neu-inset p-8 text-center">
          <p className="text-slate-500 text-sm leading-relaxed">
            Tus sesiones completadas aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sesionesCompletadas.map(sesion => {
            const rutina = rutinas.find(r => r.id === sesion.rutinaId)
            const setsDeEstaSesion = sets.filter(s => s.sesionId === sesion.id)
            const setsCompletados = setsDeEstaSesion.filter(s => s.completado)

            // Ejercicios usados en esta sesión
            const ejerciciosFuente = sesion.personalizada
              ? (ejerciciosSesion ?? []).filter(e => e.sesionId === sesion.id)
              : (ejercicios ?? []).filter(e => e.rutinaId === sesion.rutinaId)

            // Preview: peso más alto y reps de ese set por cada ejercicio
            const previewEjercicios = ejerciciosFuente.map(ej => {
              const setsDelEj = setsCompletados.filter(s => s.ejercicioId === ej.id)
              if (setsDelEj.length === 0) return null
              const mejorSet = setsDelEj.reduce((best, s) =>
                s.peso > best.peso ? s : best
              , setsDelEj[0])
              return {
                nombre: ej.nombre,
                pesoMax: mejorSet.peso,
                reps: mejorSet.reps
              }
            }).filter(Boolean) as { nombre: string; pesoMax: number; reps: number }[]

            const fecha = new Date(sesion.fecha)
            const fechaStr = fecha.toLocaleDateString('es-ES', {
              weekday: 'short', day: 'numeric', month: 'short'
            })

            return (
              <div key={sesion.id} className="neu-raised overflow-hidden">
                {/* Tarjeta principal — tap para ver detalle */}
                <button
                  onClick={() => setSesionDetalle(sesion.id!)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                        {fechaStr}
                      </p>
                      <h3 className="text-base font-semibold text-slate-700 mt-1 truncate">
                        {rutina?.grupoMuscular ?? 'Rutina eliminada'}
                        {sesion.personalizada && (
                          <span className="text-xs text-slate-500 font-normal ml-2">
                            (personalizada)
                          </span>
                        )}
                      </h3>
                    </div>
                    <ChevronRight size={20} className="text-slate-400 shrink-0 ml-2" />
                  </div>

                  {/* Preview: peso más alto por ejercicio */}
                  {previewEjercicios.length > 0 && (
                    <div className="space-y-1.5">
                      {previewEjercicios.slice(0, 4).map((ej, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Trophy size={10} className="text-amber-500 shrink-0" />
                          <span className="text-slate-600 truncate flex-1">{ej.nombre}</span>
                          <span className="font-semibold text-slate-700 shrink-0">
                            {ej.pesoMax > 0 ? `${ej.pesoMax} kg` : '—'}
                          </span>
                          <span className="text-slate-500 shrink-0">
                            × {ej.reps}
                          </span>
                        </div>
                      ))}
                      {previewEjercicios.length > 4 && (
                        <p className="text-[10px] text-slate-400 text-center mt-1">
                          +{previewEjercicios.length - 4} más
                        </p>
                      )}
                    </div>
                  )}
                </button>

                {/* Botón de borrar */}
                <div className="px-5 pb-4 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmarBorrado(sesion.id!)
                    }}
                    className="neu-button p-2.5"
                  >
                    <Trash2 size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      {confirmarBorrado !== null && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setConfirmarBorrado(null)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{ backgroundColor: '#e0e5ec' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="neu-inset w-14 h-14 rounded-full flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-center text-slate-700 font-bold text-lg mb-2">
              ¿Eliminar sesión?
            </h3>
            <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
              Se borrarán todos los datos de esta sesión. Esta acción no se puede deshacer.
            </p>

            <button
              onClick={() => setConfirmarBorrado(null)}
              className="neu-raised w-full p-4 mb-3 text-slate-700 font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => borrarSesion(confirmarBorrado)}
              className="neu-button w-full py-3 text-red-500 text-sm font-medium"
            >
              Eliminar definitivamente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
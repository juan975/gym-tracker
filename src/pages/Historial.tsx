import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Dumbbell, Trash2, AlertTriangle, ArrowLeft, Trophy } from 'lucide-react'
import { db } from '../db/database'
import { historialService } from '../services/historialService'
import { sesionService } from '../services/sesionService'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'

export default function Historial() {
  const { user } = useAuth()
  const sesiones = useLiveQuery(() => db.sesiones.toArray())
  const rutinas = useLiveQuery(() => db.rutinas.toArray())
  const sets = useLiveQuery(() => db.setsRegistrados.toArray())
  const ejercicios = useLiveQuery(() => db.ejercicios.toArray())
  const ejerciciosSesion = useLiveQuery(() => db.ejerciciosSesion.toArray())

  useEffect(() => {
    sesionService.limpiarSesionesHuerfanas()
  }, [])

  const sesionesCompletadas = useMemo(() => {
    if (!sesiones) return []
    return sesiones
      .filter(s => s.completada === true)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [sesiones])

  const [sesionDetalle, setSesionDetalle] = useState<number | null>(null)
  const [confirmarBorrado, setConfirmarBorrado] = useState<number | null>(null)

  const borrarSesion = async (sesionId: number) => {
    await sesionService.borrarSesion(sesionId, user?.uid)
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
    const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

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
                  <h3 className="text-sm font-semibold text-slate-700">{ej.nombre}</h3>
                </div>
                <div className="space-y-2">
                  {setsDelEjercicio.map(set => (
                    <div key={set.id} className="neu-inset px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 w-12">Set {set.numeroSet}</span>
                      <span className="text-sm font-semibold text-slate-700">{set.peso > 0 ? `${set.peso} kg` : '—'}</span>
                      <span className="text-sm font-semibold text-slate-700">{set.reps > 0 ? `${set.reps} reps` : '—'}</span>
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
      <PageHeader 
        titulo="Historial" 
        mostrarBienvenida={true} 
      />

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

            const ejerciciosFuente = sesion.personalizada
              ? (ejerciciosSesion ?? []).filter(e => e.sesionId === sesion.id)
              : (ejercicios ?? []).filter(e => e.rutinaId === sesion.rutinaId)

            const previewEjercicios = historialService.getPreviewEjercicios(ejerciciosFuente, setsCompletados)

            const fecha = new Date(sesion.fecha)
            const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

            return (
              <div key={sesion.id} className="neu-raised overflow-hidden">
                <button onClick={() => setSesionDetalle(sesion.id!)} className="w-full p-5 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{fechaStr}</p>
                      <h3 className="text-base font-semibold text-slate-700 mt-1 truncate">
                        {rutina?.grupoMuscular ?? 'Rutina eliminada'}
                        {sesion.personalizada && <span className="text-xs text-slate-500 font-normal ml-2">(personalizada)</span>}
                      </h3>
                    </div>
                    <ChevronRight size={20} className="text-slate-400 shrink-0 ml-2" />
                  </div>
                  {previewEjercicios.length > 0 && (
                    <div className="space-y-1.5">
                      {previewEjercicios.slice(0, 4).map((ej, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Trophy size={10} className="text-amber-500 shrink-0" />
                          <span className="text-slate-600 truncate flex-1">{ej.nombre}</span>
                          <span className="font-semibold text-slate-700 shrink-0">{ej.pesoMax > 0 ? `${ej.pesoMax} kg` : '—'}</span>
                          <span className="text-slate-500 shrink-0">× {ej.reps}</span>
                        </div>
                      ))}
                      {previewEjercicios.length > 4 && (
                        <p className="text-[10px] text-slate-400 text-center mt-1">+{previewEjercicios.length - 4} más</p>
                      )}
                    </div>
                  )}
                </button>
                <div className="px-5 pb-4 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmarBorrado(sesion.id!) }}
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

      <ConfirmModal
        open={confirmarBorrado !== null}
        onClose={() => setConfirmarBorrado(null)}
        onConfirm={() => borrarSesion(confirmarBorrado!)}
        icon={<AlertTriangle size={28} className="text-red-500" />}
        title="¿Eliminar sesión?"
        message="Se borrarán todos los datos de esta sesión. Esta acción no se puede deshacer."
        confirmText="Eliminar definitivamente"
        destructive={true}
      />
    </div>
  )
}
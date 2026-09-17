import { useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Flag } from 'lucide-react'
import { db } from '../db/database'
import { useSesionActiva } from '../hooks/useSesionActiva'
import SetRow from '../components/sesion/SetRow'
import ConfirmModal from '../components/ui/ConfirmModal'
import { THEME } from '../constants'
import { useAuth } from '../context/AuthContext'

export default function SesionActiva() {
  const { rutinaId: rutinaIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const rutinaId = Number(rutinaIdParam)
  const sesionIdParam = searchParams.get('sesionId')
  const { user } = useAuth()

  const {
    mostrarModalSalida,
    getSet,
    actualizarSet,
    finalizarSesion,
    confirmarSalida,
    cancelarSalida,
    handleVolver,
    setsCompletados
  } = useSesionActiva(rutinaId, sesionIdParam, user?.uid)

  const sesionIdParaEjercicios = sesionIdParam ? Number(sesionIdParam) : null

  // ---- Datos ----
  const rutina = useLiveQuery(() => db.rutinas.get(rutinaId), [rutinaId])
  const sesionPersonalizada = useLiveQuery(async () => {
    if (!sesionIdParaEjercicios) return undefined
    return await db.sesiones.get(sesionIdParaEjercicios)
  }, [sesionIdParaEjercicios])
  
  const esPersonalizada = sesionPersonalizada?.personalizada ?? false
  const ejerciciosBase = useLiveQuery(() => db.ejercicios.where('rutinaId').equals(rutinaId).sortBy('orden'), [rutinaId])
  const ejerciciosDeSesion = useLiveQuery(async () => {
    if (!sesionIdParaEjercicios || !esPersonalizada) return []
    return await db.ejerciciosSesion.where('sesionId').equals(sesionIdParaEjercicios).sortBy('orden')
  }, [sesionIdParaEjercicios, esPersonalizada])

  const ejercicios = esPersonalizada ? ejerciciosDeSesion : ejerciciosBase

  const totalSets = ejercicios?.reduce((acc, e) => acc + e.setsObjetivo, 0) ?? 0
  const progreso = totalSets > 0 ? Math.round((setsCompletados / totalSets) * 100) : 0

  if (!rutina || !ejercicios) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="pb-8 min-h-screen" style={{ backgroundColor: THEME.bgBase }}>
      <div className="sticky top-0 z-20 px-6 pt-6 pb-4" style={{ backgroundColor: THEME.bgBase }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handleVolver} className="neu-button p-3">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
              Entrenando · {rutina.dia}
              {esPersonalizada && <span className="ml-1">· Personalizada</span>}
            </p>
            <h1 className="text-xl font-bold text-slate-700 mt-1 leading-tight">
              {rutina.grupoMuscular}
            </h1>
          </div>
        </div>

        <div className="neu-inset p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Progreso</p>
            <p className="text-slate-700 font-semibold">
              {setsCompletados} / {totalSets} sets
            </p>
          </div>
          <div className="text-2xl font-bold text-slate-700">{progreso}%</div>
        </div>
      </div>

      <div className="px-6">
        <div className="space-y-5 mb-6">
          {ejercicios.map((ej) => (
            <div key={ej.id} className="neu-raised p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="neu-inset w-9 h-9 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {ej.orden}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-semibold text-slate-700 leading-snug">
                    {ej.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Objetivo: {ej.setsObjetivo} × {ej.repsObjetivo}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {Array.from({ length: ej.setsObjetivo }, (_, i) => i + 1).map(numSet => (
                  <SetRow
                    key={numSet}
                    numeroSet={numSet}
                    grupoMuscular={rutina.grupoMuscular}
                    repsObjetivo={ej.repsObjetivo}
                    registro={getSet(ej.id!, numSet)}
                    onGuardar={(peso, reps, completado) =>
                      actualizarSet(ej.id!, numSet, peso, reps, completado)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => finalizarSesion(ejercicios.length)}
          className="neu-raised w-full p-5 flex items-center justify-center gap-3 mb-4 text-slate-700 font-semibold"
        >
          <Flag size={20} />
          Finalizar entrenamiento
        </button>
      </div>

      <ConfirmModal
        open={mostrarModalSalida}
        onClose={cancelarSalida}
        onConfirm={confirmarSalida}
        icon={<Flag size={28} className="text-orange-500" />}
        title="¿Salir del entrenamiento?"
        message={
          <>
            Tienes <span className="font-semibold text-slate-700">{setsCompletados} sets</span> registrados.
            Si sales, perderás todo el progreso de esta sesión.
          </>
        }
        confirmText="Salir y perder progreso"
        cancelText="Seguir entrenando"
        destructive={true}
      />
    </div>
  )
}
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Play, Dumbbell } from 'lucide-react'
import { db } from '../db/database'
import { useState } from 'react'
import { Edit, Zap, Infinity as InfinityIcon } from 'lucide-react'
import UserMenu from '../components/UserMenu'

export default function RutinaDetalle({ 
  rutinaId: rutinaIdProp,
  hideBackButton = false 
}: { 
  rutinaId?: number
  hideBackButton?: boolean 
} = {}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const rutinaId = rutinaIdProp ?? Number(id)
  const [modalEditar, setModalEditar] = useState(false)

  const rutina = useLiveQuery(() => db.rutinas.get(rutinaId), [rutinaId])
  const ejercicios = useLiveQuery(() => 
    db.ejercicios.where('rutinaId').equals(rutinaId).sortBy('orden'),
    [rutinaId]
  )

  if (!rutina) {
    return (
      <div className="p-6 pt-8">
        <p className="text-slate-500 text-center">Cargando rutina...</p>
      </div>
    )
  }

    return (
    <div className="p-6">
        {/* Header con volver */}
        <div className="flex items-center gap-4 mb-8 pt-6">
        {!hideBackButton && (
            <button 
            onClick={() => navigate(-1)}
            className="neu-button p-3"
            >
            <ArrowLeft size={20} className="text-slate-600" />
            </button>
        )}
        <UserMenu />
        <div className="flex-1">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
            {rutina.dia}
            </p>
            <h1 className="text-2xl font-bold text-slate-700 mt-1 leading-tight">
            {rutina.grupoMuscular}
            </h1>
        </div>
        <button 
          onClick={() => setModalEditar(true)}
          className="neu-button p-3"
        >
          <Edit size={18} className="text-slate-600" />
        </button>
        </div>

        {/* Botón empezar */}
        <button 
        onClick={() => navigate(`/sesion/${rutinaId}`)}
        className="neu-raised w-full p-5 flex items-center justify-center gap-3 mb-8 text-slate-700 font-semibold"
        >
        <Play size={20} fill="currentColor" />
        Empezar entrenamiento
        </button>

        {/* Contador */}
        <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
        <Dumbbell size={16} />
        <span className="font-medium">
            {ejercicios?.length ?? 0} ejercicios
        </span>
        </div>

        {/* Lista de ejercicios */}
        <div className="space-y-4">
        {ejercicios?.map((ej) => (
            <div key={ej.id} className="neu-raised p-5">
            <div className="flex items-start gap-3 mb-3">
                <div className="neu-inset w-9 h-9 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                {ej.orden}
                </div>
                <h3 className="text-base font-semibold text-slate-700 leading-snug pt-1">
                {ej.nombre}
                </h3>
            </div>

            <div className="flex gap-3 mb-3 ml-12">
                <div className="neu-inset px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Series</p>
                <p className="text-slate-700 font-semibold text-center">{ej.setsObjetivo}</p>
                </div>
                <div className="neu-inset px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Reps</p>
                <p className="text-slate-700 font-semibold text-center">{ej.repsObjetivo}</p>
                </div>
            </div>

            {ej.notas && (
                <p className="text-slate-500 text-xs leading-relaxed ml-12 italic">
                {ej.notas}
                </p>
            )}
            </div>
        ))}
        </div>
        {modalEditar && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setModalEditar(false)}
          >
            <div 
              className="w-full max-w-sm p-6 rounded-3xl neu-raised"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-center text-slate-700 font-bold text-lg mb-1">
                ¿Cómo quieres editar?
              </h3>
              <p className="text-center text-slate-500 text-xs mb-5">
                Elige cómo se guardarán los cambios
              </p>

              <button
                onClick={() => navigate(`/rutina/${rutinaId}/editar?modo=sesion`)}
                className="neu-raised w-full p-4 mb-3 flex items-start gap-3 text-left"
              >
                <Zap size={22} className="text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold text-sm">Solo por hoy</p>
                  <p className="text-slate-500 text-xs mt-0.5">Los cambios aplican solo a esta sesión</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/rutina/${rutinaId}/editar?modo=permanente`)}
                className="neu-raised w-full p-4 mb-3 flex items-start gap-3 text-left"
              >
                <InfinityIcon size={22} className="text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700 font-semibold text-sm">Permanente</p>
                  <p className="text-slate-500 text-xs mt-0.5">Los cambios se guardan en la rutina</p>
                </div>
              </button>

              <button
                onClick={() => setModalEditar(false)}
                className="neu-button w-full py-3 mt-2 text-slate-600 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
    </div>
    )
}
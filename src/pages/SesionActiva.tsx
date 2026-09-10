import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Flag } from 'lucide-react'
import { db, type SetRegistrado } from '../db/database'
import PesoScroll from '../components/PesoScroll'
import { getRangoPeso } from '../utils/pesoRango'
import RepsScroll from '../components/RepsScroll'
import { getRepsObjetivo } from '../utils/repsRango'

export default function SesionActiva() {
  const { rutinaId: rutinaIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rutinaId = Number(rutinaIdParam)
  const sesionIdParam = searchParams.get('sesionId')

  const [sesionId, setSesionId] = useState<number | null>(
    sesionIdParam ? Number(sesionIdParam) : null
  )

  const rutina = useLiveQuery(() => db.rutinas.get(rutinaId), [rutinaId])

  const sesionActual = useLiveQuery(async () => {
    if (!sesionId) return undefined
    return await db.sesiones.get(sesionId)
  }, [sesionId])
  const esPersonalizada = sesionActual?.personalizada ?? false

  // Ejercicios base
  const ejerciciosBase = useLiveQuery(() =>
    db.ejercicios.where('rutinaId').equals(rutinaId).sortBy('orden'),
    [rutinaId]
  )

  // Ejercicios de sesión (si aplica)
  const ejerciciosDeSesion = useLiveQuery(async () => {
    if (!sesionId || !esPersonalizada) return []
    return await db.ejerciciosSesion.where('sesionId').equals(sesionId).sortBy('orden')
  }, [sesionId, esPersonalizada])

  const ejercicios = esPersonalizada ? ejerciciosDeSesion : ejerciciosBase

  // Sets registrados de esta sesión
  const setsRegistrados = useLiveQuery(() =>
    sesionId
      ? db.setsRegistrados.where('sesionId').equals(sesionId).toArray()
      : Promise.resolve([] as SetRegistrado[]),
    [sesionId]
  )

  useEffect(() => {
    if (sesionIdParam) return   // ya viene con sesión creada
    const crearSesion = async () => {
      const id = await db.sesiones.add({
        rutinaId,
        fecha: new Date(),
        completada: false,
        personalizada: false
      })
      setSesionId(id)
    }
    if (rutinaId) crearSesion()
  }, [rutinaId, sesionIdParam])

  const getSet = (ejercicioId: number, numeroSet: number): SetRegistrado | undefined => {
    return setsRegistrados?.find(
      s => s.ejercicioId === ejercicioId && s.numeroSet === numeroSet
    )
  }

  const guardarSet = async (
    ejercicioId: number,
    numeroSet: number,
    peso: number,
    reps: number,
    completado: boolean
  ) => {
    if (!sesionId) return
    const existente = getSet(ejercicioId, numeroSet)
    if (existente?.id) {
      await db.setsRegistrados.update(existente.id, { peso, reps, completado })
    } else {
      await db.setsRegistrados.add({
        sesionId,
        ejercicioId,
        numeroSet,
        peso,
        reps,
        completado
      })
    }
  }

  const finalizarSesion = async () => {
    if (!sesionId) return
    await db.sesiones.update(sesionId, { completada: true })
    navigate('/historial')
  }

  const totalSets = ejercicios?.reduce((acc, e) => acc + e.setsObjetivo, 0) ?? 0
  const setsCompletados = setsRegistrados?.filter(s => s.completado).length ?? 0
  const progreso = totalSets > 0 ? Math.round((setsCompletados / totalSets) * 100) : 0

  if (!rutina || !ejercicios) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6 pt-6">
        <button onClick={() => navigate(-1)} className="neu-button p-3">
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

      <div className="neu-inset p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Progreso</p>
          <p className="text-slate-700 font-semibold">
            {setsCompletados} / {totalSets} sets
          </p>
        </div>
        <div className="text-2xl font-bold text-slate-700">{progreso}%</div>
      </div>

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
                    guardarSet(ej.id!, numSet, peso, reps, completado)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={finalizarSesion}
        className="neu-raised w-full p-5 flex items-center justify-center gap-3 mb-4 text-slate-700 font-semibold"
      >
        <Flag size={20} />
        Finalizar entrenamiento
      </button>
    </div>
  )
}

function SetRow({
  numeroSet,
  registro,
  grupoMuscular,
  repsObjetivo,
  onGuardar
}: {
  numeroSet: number
  registro?: SetRegistrado
  grupoMuscular?: string
  repsObjetivo: string
  onGuardar: (peso: number, reps: number, completado: boolean) => void
}) {
  const repsMax = getRepsObjetivo(repsObjetivo)
  const [peso, setPeso] = useState(registro?.peso ?? 0)
  const [reps, setReps] = useState(registro?.reps ?? 0)
  const [modalPesoAbierto, setModalPesoAbierto] = useState(false)
  const [modalRepsAbierto, setModalRepsAbierto] = useState(false)

  useEffect(() => {
    setPeso(registro?.peso ?? 0)
    setReps(registro?.reps ?? 0)
  }, [registro?.peso, registro?.reps])

  const completado = registro?.completado ?? false
  const rango = getRangoPeso(grupoMuscular)

  const toggleCompletado = () => {
    const marcandoComoCompleto = !completado
    const repsFinal = (marcandoComoCompleto && reps === 0) ? repsMax : reps
    if (repsFinal !== reps) setReps(repsFinal)
    onGuardar(peso, repsFinal, marcandoComoCompleto)
  }

  const handlePesoChange = (nuevoKg: number) => {
    setPeso(nuevoKg)
    onGuardar(nuevoKg, reps, completado)
  }

  const handleRepsChange = (nuevasReps: number) => {
    setReps(nuevasReps)
    onGuardar(peso, nuevasReps, completado)
  }

  const repsParaScroll = reps === 0 ? repsMax : reps

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="neu-inset w-8 h-10 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
          {numeroSet}
        </div>

        <button
          onClick={() => setModalPesoAbierto(true)}
          className="neu-inset flex-1 px-3 py-1 text-left"
        >
          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Kg</p>
          <p className="text-slate-700 font-semibold text-sm">
            {peso > 0 ? peso : '—'}
          </p>
        </button>

        <button
          onClick={() => setModalRepsAbierto(true)}
          className="neu-inset flex-1 px-3 py-1 text-left"
        >
          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Reps</p>
          <p className="text-slate-700 font-semibold text-sm">
            {reps > 0 ? reps : '—'}
          </p>
        </button>

        <button
          onClick={toggleCompletado}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
            completado ? 'neu-active' : 'neu-button'
          }`}
        >
          <Check
            size={18}
            className={completado ? 'text-green-600' : 'text-slate-400'}
            strokeWidth={completado ? 3 : 2}
          />
        </button>
      </div>

      {/* Modal Peso */}
      {modalPesoAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalPesoAbierto(false)}
        >
          <div 
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{ backgroundColor: '#e0e5ec' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">
              Set {numeroSet}
            </p>
            <h3 className="text-center text-slate-700 font-bold text-lg mb-4">
              Seleccionar peso
            </h3>

            <PesoScroll
              valorKg={peso}
              onChange={handlePesoChange}
              rangoMax={rango.max}
              saltoKg={rango.salto}
            />

            <button
              onClick={() => setModalPesoAbierto(false)}
              className="neu-button w-full py-3 mt-4 text-slate-700 font-semibold"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Modal Reps */}
      {modalRepsAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalRepsAbierto(false)}
        >
          <div 
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{ backgroundColor: '#e0e5ec' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">
              Set {numeroSet}
            </p>
            <h3 className="text-center text-slate-700 font-bold text-lg mb-1">
              Repeticiones
            </h3>
            <p className="text-center text-slate-500 text-xs mb-4">
              Objetivo: <span className="font-semibold text-slate-700">{repsObjetivo}</span>
            </p>

            <RepsScroll
              valor={repsParaScroll}
              onChange={handleRepsChange}
              max={Math.max(50, repsMax + 20)}
            />

            <button
              onClick={() => setModalRepsAbierto(false)}
              className="neu-button w-full py-3 mt-4 text-slate-700 font-semibold"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  )
}
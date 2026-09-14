import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Flag, AlertTriangle } from 'lucide-react'
import { db } from '../db/database'
import PesoScroll from '../components/PesoScroll'
import { getRangoPeso } from '../utils/pesoRango'
import RepsScroll from '../components/RepsScroll'
import { getRepsObjetivo } from '../utils/repsRango'

// ---- Tipos para el cache en memoria ----
interface SetCache {
  peso: number
  reps: number
  completado: boolean
}

type SetsMap = Record<string, SetCache>  // key: "ejercicioId-numeroSet"

function makeSetKey(ejercicioId: number, numeroSet: number) {
  return `${ejercicioId}-${numeroSet}`
}

// ---- SessionStorage helpers ----
function getStorageKey(rutinaId: number, sesionIdParam: string | null) {
  return `sesion-activa-${rutinaId}${sesionIdParam ? `-${sesionIdParam}` : ''}`
}

function guardarEnStorage(key: string, data: SetsMap) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {
    // sessionStorage lleno o no disponible — ignoramos
  }
}

function cargarDeStorage(key: string): SetsMap | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // parse error — ignoramos
  }
  return null
}

function limpiarStorage(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignoramos
  }
}

// ============================================================
// Componente principal
// ============================================================
export default function SesionActiva() {
  const { rutinaId: rutinaIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rutinaId = Number(rutinaIdParam)
  const sesionIdParam = searchParams.get('sesionId')

  const storageKey = getStorageKey(rutinaId, sesionIdParam)

  // Cache de sets en memoria
  const [setsCache, setSetsCache] = useState<SetsMap>(() => {
    return cargarDeStorage(storageKey) ?? {}
  })

  // Para la sesión personalizada, necesitamos el sesionId original para leer ejerciciosSesion
  const sesionIdParaEjercicios = sesionIdParam ? Number(sesionIdParam) : null

  // Modal de confirmación de salida
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false)

  // Flag para saber si hay datos en el cache
  const hayDatos = Object.keys(setsCache).length > 0

  // ---- Datos de la rutina ----
  const rutina = useLiveQuery(() => db.rutinas.get(rutinaId), [rutinaId])

  // Para sesiones personalizadas, cargar la sesión existente
  const sesionPersonalizada = useLiveQuery(async () => {
    if (!sesionIdParaEjercicios) return undefined
    return await db.sesiones.get(sesionIdParaEjercicios)
  }, [sesionIdParaEjercicios])
  const esPersonalizada = sesionPersonalizada?.personalizada ?? false

  // Ejercicios base
  const ejerciciosBase = useLiveQuery(() =>
    db.ejercicios.where('rutinaId').equals(rutinaId).sortBy('orden'),
    [rutinaId]
  )

  // Ejercicios de sesión personalizada
  const ejerciciosDeSesion = useLiveQuery(async () => {
    if (!sesionIdParaEjercicios || !esPersonalizada) return []
    return await db.ejerciciosSesion.where('sesionId').equals(sesionIdParaEjercicios).sortBy('orden')
  }, [sesionIdParaEjercicios, esPersonalizada])

  const ejercicios = esPersonalizada ? ejerciciosDeSesion : ejerciciosBase

  // ---- Persistir cache en sessionStorage ----
  useEffect(() => {
    guardarEnStorage(storageKey, setsCache)
  }, [setsCache, storageKey])

  // ---- Protección contra salida accidental: beforeunload ----
  useEffect(() => {
    if (!hayDatos) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hayDatos])

  // ---- Protección contra botón atrás del navegador/gesto ----
  useEffect(() => {
    if (!hayDatos) return
    // Añadir entrada extra en el historial para interceptar el gesto "atrás"
    window.history.pushState({ sesionActiva: true }, '')
    const handlePopState = () => {
      // Cuando el usuario presiona atrás, mostramos el modal en vez de navegar
      setMostrarModalSalida(true)
      // Re-push para que el siguiente "atrás" también sea interceptado
      window.history.pushState({ sesionActiva: true }, '')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [hayDatos])

  // ---- Funciones del cache ----
  const getSet = (ejercicioId: number, numeroSet: number): SetCache | undefined => {
    return setsCache[makeSetKey(ejercicioId, numeroSet)]
  }

  const actualizarSet = (
    ejercicioId: number,
    numeroSet: number,
    peso: number,
    reps: number,
    completado: boolean
  ) => {
    setSetsCache(prev => ({
      ...prev,
      [makeSetKey(ejercicioId, numeroSet)]: { peso, reps, completado }
    }))
  }

  // ---- Finalizar: persistir TODO a DB en una transacción ----
  const finalizarSesion = async () => {
    if (!ejercicios || ejercicios.length === 0) return

    await db.transaction('rw', db.sesiones, db.setsRegistrados, async () => {
      let sesionId: number

      if (sesionIdParaEjercicios) {
        // Sesión personalizada: ya existe, la marcamos completada
        await db.sesiones.update(sesionIdParaEjercicios, { completada: true })
        sesionId = sesionIdParaEjercicios
      } else {
        // Sesión normal: crear nueva
        sesionId = await db.sesiones.add({
          rutinaId,
          fecha: new Date(),
          completada: true,
          personalizada: false
        })
      }

      // Guardar todos los sets del cache
      const setsParaGuardar = Object.entries(setsCache)
        .map(([key, set]) => {
          const [ejId, numSet] = key.split('-').map(Number)
          return {
            sesionId,
            ejercicioId: ejId,
            numeroSet: numSet,
            peso: set.peso,
            reps: set.reps,
            completado: set.completado
          }
        })

      if (setsParaGuardar.length > 0) {
        await db.setsRegistrados.bulkAdd(setsParaGuardar)
      }
    })

    // Limpiar cache
    limpiarStorage(storageKey)
    setSetsCache({})

    navigate('/historial')
  }

  // ---- Confirmar salida ----
  const confirmarSalida = () => {
    limpiarStorage(storageKey)
    setSetsCache({})
    setMostrarModalSalida(false)
    // Navegar atrás (saltando la entrada extra que pusimos)
    navigate(-1)
  }

  const cancelarSalida = () => {
    setMostrarModalSalida(false)
  }

  // Botón de volver: muestra confirmación si hay datos
  const handleVolver = () => {
    if (hayDatos) {
      setMostrarModalSalida(true)
    } else {
      navigate(-1)
    }
  }

  // ---- Cálculos de progreso ----
  const totalSets = ejercicios?.reduce((acc, e) => acc + e.setsObjetivo, 0) ?? 0
  const setsCompletados = Object.values(setsCache).filter(s => s.completado).length
  const progreso = totalSets > 0 ? Math.round((setsCompletados / totalSets) * 100) : 0

  if (!rutina || !ejercicios) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="pb-8 min-h-screen" style={{ backgroundColor: '#e0e5ec' }}>
      {/* Sticky header + barra de progreso */}
      <div className="sticky top-0 z-20 px-6 pt-6 pb-4" style={{ backgroundColor: '#e0e5ec' }}>
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

      {/* Contenido scrollable */}
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
        onClick={finalizarSesion}
        className="neu-raised w-full p-5 flex items-center justify-center gap-3 mb-4 text-slate-700 font-semibold"
      >
        <Flag size={20} />
        Finalizar entrenamiento
      </button>
      </div>

      {/* Modal de confirmación de salida */}
      {mostrarModalSalida && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={cancelarSalida}
        >
          <div
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{ backgroundColor: '#e0e5ec' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="neu-inset w-14 h-14 rounded-full flex items-center justify-center">
                <AlertTriangle size={28} className="text-orange-500" />
              </div>
            </div>
            <h3 className="text-center text-slate-700 font-bold text-lg mb-2">
              ¿Salir del entrenamiento?
            </h3>
            <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
              Tienes <span className="font-semibold text-slate-700">{setsCompletados} sets</span> registrados.
              Si sales, perderás todo el progreso de esta sesión.
            </p>

            <button
              onClick={cancelarSalida}
              className="neu-raised w-full p-4 mb-3 text-slate-700 font-semibold text-sm"
            >
              Seguir entrenando
            </button>
            <button
              onClick={confirmarSalida}
              className="neu-button w-full py-3 text-red-500 text-sm font-medium"
            >
              Salir y perder progreso
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SetRow — Componente de cada set individual
// ============================================================
function SetRow({
  numeroSet,
  registro,
  grupoMuscular,
  repsObjetivo,
  onGuardar
}: {
  numeroSet: number
  registro?: SetCache
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
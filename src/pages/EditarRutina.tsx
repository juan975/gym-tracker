import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { db, type Ejercicio } from '../db/database'

type EjercicioEditable = Omit<Ejercicio, 'id' | 'rutinaId'> & { 
  id?: number
  _tempId: string  // para tracking en el UI
}

export default function EditarRutina() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rutinaId = Number(id)
  const modo = searchParams.get('modo') as 'permanente' | 'sesion' | null

  const rutina = useLiveQuery(() => db.rutinas.get(rutinaId), [rutinaId])
  const ejerciciosDB = useLiveQuery(() =>
    db.ejercicios.where('rutinaId').equals(rutinaId).sortBy('orden'),
    [rutinaId]
  )

  const [items, setItems] = useState<EjercicioEditable[]>([])
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    if (ejerciciosDB && !cargado) {
      setItems(ejerciciosDB.map(e => ({
        ...e,
        _tempId: `db-${e.id}`
      })))
      setCargado(true)
    }
  }, [ejerciciosDB, cargado])

  const actualizarEjercicio = (tempId: string, campo: keyof EjercicioEditable, valor: string | number) => {
    setItems(items.map(item =>
      item._tempId === tempId ? { ...item, [campo]: valor } : item
    ))
  }

  const eliminarEjercicio = (tempId: string) => {
    setItems(items.filter(item => item._tempId !== tempId).map((item, i) => ({ ...item, orden: i + 1 })))
  }

  const agregarEjercicio = () => {
    setItems([...items, {
      _tempId: `new-${Date.now()}`,
      nombre: 'Nuevo ejercicio',
      setsObjetivo: 3,
      repsObjetivo: '10',
      notas: '',
      orden: items.length + 1
    }])
  }

  const moverArriba = (idx: number) => {
    if (idx === 0) return
    const nuevos = [...items]
    ;[nuevos[idx - 1], nuevos[idx]] = [nuevos[idx], nuevos[idx - 1]]
    setItems(nuevos.map((item, i) => ({ ...item, orden: i + 1 })))
  }

  const moverAbajo = (idx: number) => {
    if (idx === items.length - 1) return
    const nuevos = [...items]
    ;[nuevos[idx], nuevos[idx + 1]] = [nuevos[idx + 1], nuevos[idx]]
    setItems(nuevos.map((item, i) => ({ ...item, orden: i + 1 })))
  }

  const guardar = async () => {
    if (modo === 'permanente') {
      // Borrar todos los ejercicios actuales de esta rutina y reinsertar
      await db.transaction('rw', db.ejercicios, async () => {
        await db.ejercicios.where('rutinaId').equals(rutinaId).delete()
        await db.ejercicios.bulkAdd(items.map((item, i) => ({
          rutinaId,
          nombre: item.nombre,
          setsObjetivo: item.setsObjetivo,
          repsObjetivo: item.repsObjetivo,
          notas: item.notas,
          orden: i + 1
        })))
      })
      navigate(`/rutina/${rutinaId}`)
    } else if (modo === 'sesion') {
      // Crear sesión personalizada y sus ejercicios de sesión
      const sesionId = await db.sesiones.add({
        rutinaId,
        fecha: new Date(),
        completada: false,
        personalizada: true
      })
      await db.ejerciciosSesion.bulkAdd(items.map((item, i) => ({
        sesionId,
        ejercicioBaseId: item.id,
        nombre: item.nombre,
        setsObjetivo: item.setsObjetivo,
        repsObjetivo: item.repsObjetivo,
        notas: item.notas,
        orden: i + 1
      })))
      navigate(`/sesion/${rutinaId}?sesionId=${sesionId}`)
    }
  }

  if (!rutina || !modo) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-6">
        <button onClick={() => navigate(-1)} className="neu-button p-3">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
            {modo === 'permanente' ? 'Editar permanentemente' : 'Editar solo por hoy'}
          </p>
          <h1 className="text-xl font-bold text-slate-700 mt-1 leading-tight">
            {rutina.grupoMuscular}
          </h1>
        </div>
      </div>

      {/* Aviso del modo */}
      <div className="neu-inset p-4 mb-6">
        <p className="text-slate-500 text-xs leading-relaxed">
          {modo === 'permanente'
            ? '⚠️ Los cambios se aplicarán a esta rutina para siempre.'
            : '💡 Los cambios solo aplicarán a la sesión de hoy. Al terminar, la rutina original queda intacta.'}
        </p>
      </div>

      {/* Lista de ejercicios */}
      <div className="space-y-4 mb-6">
        {items.map((item, idx) => (
          <div key={item._tempId} className="neu-raised p-4">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => moverArriba(idx)}
                  disabled={idx === 0}
                  className="neu-button w-7 h-7 flex items-center justify-center text-xs text-slate-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button 
                  onClick={() => moverAbajo(idx)}
                  disabled={idx === items.length - 1}
                  className="neu-button w-7 h-7 flex items-center justify-center text-xs text-slate-600 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={item.nombre}
                  onChange={e => actualizarEjercicio(item._tempId, 'nombre', e.target.value)}
                  className="neu-inset w-full px-3 py-2 text-sm font-semibold text-slate-700 outline-none rounded-xl"
                  placeholder="Nombre del ejercicio"
                />
              </div>

              <button
                onClick={() => eliminarEjercicio(item._tempId)}
                className="neu-button w-9 h-9 flex items-center justify-center text-slate-500"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <div className="neu-inset flex-1 px-3 py-2 rounded-xl">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Series</p>
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.setsObjetivo}
                  onChange={e => actualizarEjercicio(item._tempId, 'setsObjetivo', Number(e.target.value) || 0)}
                  className="w-full bg-transparent outline-none text-slate-700 font-semibold text-sm"
                />
              </div>
              <div className="neu-inset flex-1 px-3 py-2 rounded-xl">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Reps</p>
                <input
                  type="text"
                  value={item.repsObjetivo}
                  onChange={e => actualizarEjercicio(item._tempId, 'repsObjetivo', e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-700 font-semibold text-sm"
                  placeholder="8-10"
                />
              </div>
            </div>

            <input
              type="text"
              value={item.notas ?? ''}
              onChange={e => actualizarEjercicio(item._tempId, 'notas', e.target.value)}
              className="neu-inset w-full px-3 py-2 text-xs text-slate-500 outline-none rounded-xl italic"
              placeholder="Notas (opcional)"
            />
          </div>
        ))}
      </div>

      {/* Agregar */}
      <button
        onClick={agregarEjercicio}
        className="neu-button w-full py-4 mb-4 flex items-center justify-center gap-2 text-slate-700 font-medium"
      >
        <Plus size={18} />
        Añadir ejercicio
      </button>

      {/* Guardar */}
      <button
        onClick={guardar}
        className="neu-raised w-full p-5 flex items-center justify-center gap-3 text-slate-700 font-semibold"
      >
        <Save size={20} />
        {modo === 'permanente' ? 'Guardar cambios' : 'Empezar entrenamiento'}
      </button>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import PesoScroll from '../PesoScroll'
import RepsScroll from '../RepsScroll'
import Modal from '../ui/Modal'
import { getRangoPeso } from '../../utils/pesoRango'
import { getRepsObjetivo } from '../../utils/repsRango'
import type { SetCache } from '../../types'

export default function SetRow({
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
      <Modal open={modalPesoAbierto} onClose={() => setModalPesoAbierto(false)} align="bottom">
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
      </Modal>

      {/* Modal Reps */}
      <Modal open={modalRepsAbierto} onClose={() => setModalRepsAbierto(false)} align="bottom">
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
      </Modal>
    </>
  )
}

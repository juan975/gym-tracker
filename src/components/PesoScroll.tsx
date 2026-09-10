import { useEffect, useRef, useState } from 'react'

interface Props {
  valorKg: number
  onChange: (nuevoValorKg: number) => void
  rangoMax: number
  saltoKg: number
}

const KG_TO_LB = 2.20462

export default function PesoScroll({ valorKg, onChange, rangoMax, saltoKg }: Props) {
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg')
  const scrollRef = useRef<HTMLDivElement>(null)
  const ignorarScrollRef = useRef(false)

  // Genera los valores según la unidad activa
  const salto = unidad === 'kg' ? saltoKg : Math.round(saltoKg * KG_TO_LB)
  const max = unidad === 'kg' ? rangoMax : Math.round(rangoMax * KG_TO_LB)
  const valores: number[] = []
  for (let v = 0; v <= max; v += salto) valores.push(v)

  const ITEM_HEIGHT = 48

  // Convierte kg guardado al valor mostrado
  const valorMostrado = unidad === 'kg' 
    ? valorKg 
    : Math.round(valorKg * KG_TO_LB / salto) * salto

  // Cuando cambia el valor externo o la unidad, centramos el scroll
  useEffect(() => {
    if (!scrollRef.current) return
    const idx = valores.findIndex(v => v === valorMostrado)
    if (idx >= 0) {
      ignorarScrollRef.current = true
      scrollRef.current.scrollTop = idx * ITEM_HEIGHT
      setTimeout(() => { ignorarScrollRef.current = false }, 100)
    }
  }, [unidad, valorMostrado])

  const handleScroll = () => {
    if (!scrollRef.current || ignorarScrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)
    const nuevoValor = valores[Math.max(0, Math.min(idx, valores.length - 1))]
    if (nuevoValor === undefined) return

    // Convertir a kg si estamos en lb
    const enKg = unidad === 'kg' ? nuevoValor : nuevoValor / KG_TO_LB
    // Redondear a 1 decimal para no acumular error
    const kgFinal = Math.round(enKg * 10) / 10
    if (kgFinal !== valorKg) onChange(kgFinal)
  }

  const toggleUnidad = () => {
    setUnidad(u => u === 'kg' ? 'lb' : 'kg')
  }

  return (
    <div className="flex flex-col items-center">
      {/* Toggle Kg/Lb */}
      <div className="neu-inset flex mb-4 p-1 rounded-full">
        <button
          onClick={() => setUnidad('kg')}
          className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            unidad === 'kg' ? 'neu-raised text-slate-700' : 'text-slate-500'
          }`}
        >
          KG
        </button>
        <button
          onClick={() => setUnidad('lb')}
          className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            unidad === 'lb' ? 'neu-raised text-slate-700' : 'text-slate-500'
          }`}
        >
          LB
        </button>
      </div>

      {/* Scroll con snap */}
      <div className="relative w-full max-w-xs">
        {/* Indicador central (detrás de los números) */}
        <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 neu-inset rounded-2xl pointer-events-none z-0" />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-60 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative z-10"
          style={{ scrollBehavior: 'smooth', paddingTop: 96, paddingBottom: 96 }}
        >
          {valores.map(v => (
            <div
              key={v}
              className="h-12 flex items-center justify-center snap-center"
            >
              <span className={`text-2xl font-bold transition-all ${
                v === valorMostrado 
                  ? 'text-slate-800 scale-110' 
                  : 'text-slate-400 opacity-60'
              }`}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-500 text-xs mt-3">
        Guardado como <span className="font-semibold text-slate-700">{valorKg} kg</span>
        {unidad === 'lb' && <span> · {(valorKg * KG_TO_LB).toFixed(1)} lb</span>}
      </p>

      <button
        onClick={toggleUnidad}
        className="hidden"
      />
    </div>
  )
}
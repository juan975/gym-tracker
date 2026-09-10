import { useEffect, useRef } from 'react'

interface Props {
  valor: number
  onChange: (nuevoValor: number) => void
  max?: number
}

export default function RepsScroll({ valor, onChange, max = 50 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const ignorarScrollRef = useRef(false)

  const valores: number[] = []
  for (let v = 0; v <= max; v++) valores.push(v)

  const ITEM_HEIGHT = 48

  useEffect(() => {
    if (!scrollRef.current) return
    const idx = valores.findIndex(v => v === valor)
    if (idx >= 0) {
      ignorarScrollRef.current = true
      scrollRef.current.scrollTop = idx * ITEM_HEIGHT
      setTimeout(() => { ignorarScrollRef.current = false }, 100)
    }
  }, [valor])

  const handleScroll = () => {
    if (!scrollRef.current || ignorarScrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)
    const nuevoValor = valores[Math.max(0, Math.min(idx, valores.length - 1))]
    if (nuevoValor === undefined) return
    if (nuevoValor !== valor) onChange(nuevoValor)
  }

  return (
    <div className="relative w-full max-w-xs mx-auto">
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
              v === valor 
                ? 'text-slate-800 scale-110' 
                : 'text-slate-400 opacity-60'
            }`}>
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
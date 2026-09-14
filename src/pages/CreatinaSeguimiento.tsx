import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { db } from '../db/database'

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDiasDelMes(año: number, mes: number): Date[] {
  const dias: Date[] = []
  const totalDias = new Date(año, mes + 1, 0).getDate()
  for (let d = 1; d <= totalDias; d++) {
    dias.push(new Date(año, mes, d))
  }
  return dias
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const NOMBRES_DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function CreatinaSeguimiento() {
  const hoy = new Date()
  const [mesActual, setMesActual] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() })

  // Todos los registros de creatina
  const registros = useLiveQuery(() => db.creatina.toArray())

  // Set de fechas tomadas para búsqueda rápida
  const fechasTomadas = useMemo(() => {
    if (!registros) return new Set<string>()
    return new Set(
      registros.filter(r => r.tomada).map(r => r.fecha)
    )
  }, [registros])

  // Días del mes actual
  const diasDelMes = useMemo(() => {
    return getDiasDelMes(mesActual.año, mesActual.mes)
  }, [mesActual.año, mesActual.mes])

  // Primer día de la semana del mes (0=dom, queremos lun=0)
  const primerDiaSemana = useMemo(() => {
    const dia = new Date(mesActual.año, mesActual.mes, 1).getDay()
    // Convertir: dom=0 → 6, lun=1 → 0, mar=2 → 1, etc.
    return dia === 0 ? 6 : dia - 1
  }, [mesActual.año, mesActual.mes])

  // Stats del mes
  const statsDelMes = useMemo(() => {
    const diasMes = diasDelMes.map(d => toISO(d))
    const hoyISO = toISO(hoy)
    const tomados = diasMes.filter(d => fechasTomadas.has(d)).length
    const diasTranscurridos = diasMes.filter(d => d <= hoyISO).length
    const porcentaje = diasTranscurridos > 0 ? Math.round((tomados / diasTranscurridos) * 100) : 0
    return { tomados, diasTranscurridos, porcentaje }
  }, [diasDelMes, fechasTomadas])

  // Racha actual (días consecutivos tomando creatina hacia atrás desde hoy)
  const racha = useMemo(() => {
    let contador = 0
    const ahora = new Date()
    for (let i = 0; i < 365; i++) {
      const dia = new Date(ahora)
      dia.setDate(ahora.getDate() - i)
      const iso = toISO(dia)
      if (fechasTomadas.has(iso)) {
        contador++
      } else {
        break
      }
    }
    return contador
  }, [fechasTomadas])

  // Toggle de día
  const toggleDia = async (fecha: string) => {
    const existente = await db.creatina.where('fecha').equals(fecha).first()
    if (existente) {
      await db.creatina.update(existente.id!, { tomada: !existente.tomada })
    } else {
      await db.creatina.add({ fecha, tomada: true })
    }
  }

  // Navegación de meses
  const mesAnterior = () => {
    setMesActual(prev => {
      if (prev.mes === 0) return { año: prev.año - 1, mes: 11 }
      return { ...prev, mes: prev.mes - 1 }
    })
  }

  const mesSiguiente = () => {
    setMesActual(prev => {
      if (prev.mes === 11) return { año: prev.año + 1, mes: 0 }
      return { ...prev, mes: prev.mes + 1 }
    })
  }

  const hoyISO = toISO(hoy)
  const tomadaHoy = fechasTomadas.has(hoyISO)

  if (!registros) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-8 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Suplementación</p>
        <h1 className="text-3xl font-bold text-slate-700 mt-1">Creatina</h1>
      </div>

      {/* Botón rápido: ¿Tomaste hoy? */}
      <button
        onClick={() => toggleDia(hoyISO)}
        className={`w-full p-5 mb-6 flex items-center justify-center gap-3 font-semibold transition-all ${
          tomadaHoy ? 'neu-active text-green-600' : 'neu-raised text-slate-700'
        }`}
      >
        <Check size={22} strokeWidth={tomadaHoy ? 3 : 2} />
        {tomadaHoy ? '¡Creatina tomada hoy!' : 'Marcar creatina de hoy'}
      </button>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Racha</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">{racha}</p>
          <p className="text-xs text-slate-500 mt-1">
            {racha === 1 ? 'día' : 'días'} seguidos
          </p>
        </div>

        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Check size={16} className="text-green-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Este mes</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">
            {statsDelMes.porcentaje}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {statsDelMes.tomados} / {statsDelMes.diasTranscurridos} días
          </p>
        </div>
      </div>

      {/* Calendario */}
      <div className="neu-raised p-5">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={mesAnterior} className="neu-button p-2.5">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-slate-700 font-bold text-base">
            {NOMBRES_MESES[mesActual.mes]} {mesActual.año}
          </h2>
          <button onClick={mesSiguiente} className="neu-button p-2.5">
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Nombres de los días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {NOMBRES_DIAS.map(nombre => (
            <div key={nombre} className="text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-1">
              {nombre}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1">
          {/* Celdas vacías para alinear el primer día */}
          {Array.from({ length: primerDiaSemana }, (_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {diasDelMes.map(dia => {
            const iso = toISO(dia)
            const tomada = fechasTomadas.has(iso)
            const esHoy = iso === hoyISO
            const esFuturo = dia > hoy && !esHoy

            return (
              <button
                key={iso}
                onClick={() => !esFuturo && toggleDia(iso)}
                disabled={esFuturo}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                  tomada
                    ? 'neu-active text-green-600'
                    : esHoy
                      ? 'neu-inset text-slate-700'
                      : esFuturo
                        ? 'text-slate-400 opacity-40'
                        : 'neu-inset text-slate-600'
                }`}
              >
                {tomada ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  dia.getDate()
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

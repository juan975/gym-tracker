import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { db } from '../db/database'
import { creatinaService, toISO, getDiasDelMes } from '../services/creatinaService'
import { MESES, NOMBRES_DIAS_CALENDARIO } from '../constants'

export default function CreatinaSeguimiento() {
  const hoy = new Date()
  const [mesActual, setMesActual] = useState({ año: hoy.getFullYear(), mes: hoy.getMonth() })

  const registros = useLiveQuery(() => db.creatina.toArray())

  const fechasTomadas = useMemo(() => {
    if (!registros) return new Set<string>()
    return new Set(registros.filter(r => r.tomada).map(r => r.fecha))
  }, [registros])

  const diasDelMes = useMemo(() => {
    return getDiasDelMes(mesActual.año, mesActual.mes)
  }, [mesActual.año, mesActual.mes])

  const primerDiaSemana = useMemo(() => {
    const dia = new Date(mesActual.año, mesActual.mes, 1).getDay()
    return dia === 0 ? 6 : dia - 1 // dom=0 → 6, lun=1 → 0, mar=2 → 1
  }, [mesActual.año, mesActual.mes])

  const statsDelMes = useMemo(() => {
    return creatinaService.calcularStatsDelMes(diasDelMes, fechasTomadas)
  }, [diasDelMes, fechasTomadas])

  const racha = useMemo(() => {
    return creatinaService.calcularRacha(fechasTomadas)
  }, [fechasTomadas])

  const mesAnterior = () => {
    setMesActual(prev => prev.mes === 0 ? { año: prev.año - 1, mes: 11 } : { ...prev, mes: prev.mes - 1 })
  }

  const mesSiguiente = () => {
    setMesActual(prev => prev.mes === 11 ? { año: prev.año + 1, mes: 0 } : { ...prev, mes: prev.mes + 1 })
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

      <button
        onClick={() => creatinaService.toggleDia(hoyISO)}
        className={`w-full p-5 mb-6 flex items-center justify-center gap-3 font-semibold transition-all ${
          tomadaHoy ? 'neu-active text-green-600' : 'neu-raised text-slate-700'
        }`}
      >
        <Check size={22} strokeWidth={tomadaHoy ? 3 : 2} />
        {tomadaHoy ? '¡Creatina tomada hoy!' : 'Marcar creatina de hoy'}
      </button>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Racha</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">{racha}</p>
          <p className="text-xs text-slate-500 mt-1">{racha === 1 ? 'día' : 'días'} seguidos</p>
        </div>

        <div className="neu-raised p-5">
          <div className="flex items-center gap-2 mb-2">
            <Check size={16} className="text-green-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Este mes</p>
          </div>
          <p className="text-3xl font-bold text-slate-700">{statsDelMes.porcentaje}%</p>
          <p className="text-xs text-slate-500 mt-1">{statsDelMes.tomados} / {statsDelMes.diasTranscurridos} días</p>
        </div>
      </div>

      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={mesAnterior} className="neu-button p-2.5">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-slate-700 font-bold text-base">
            {MESES[mesActual.mes]} {mesActual.año}
          </h2>
          <button onClick={mesSiguiente} className="neu-button p-2.5">
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {NOMBRES_DIAS_CALENDARIO.map(nombre => (
            <div key={nombre} className="text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-1">
              {nombre}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primerDiaSemana }, (_, i) => <div key={`empty-${i}`} className="h-10" />)}
          
          {diasDelMes.map(dia => {
            const iso = toISO(dia)
            const tomada = fechasTomadas.has(iso)
            const esHoy = iso === hoyISO
            const esFuturo = dia > hoy && !esHoy

            return (
              <button
                key={iso}
                onClick={() => !esFuturo && creatinaService.toggleDia(iso)}
                disabled={esFuturo}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                  tomada ? 'neu-active text-green-600' : esHoy ? 'neu-inset text-slate-700' : esFuturo ? 'text-slate-400 opacity-40' : 'neu-inset text-slate-600'
                }`}
              >
                {tomada ? <Check size={14} strokeWidth={3} /> : dia.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

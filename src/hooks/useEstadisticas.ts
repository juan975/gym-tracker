import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { ResumenDia } from '../types'
import { DIAS_SEMANA_CORTOS } from '../constants'

export function useEstadisticas() {
  const sesiones = useLiveQuery(async () => {
    const todas = await db.sesiones.toArray()
    return todas.filter(s => s.completada === true)
  })

  // Días únicos entrenados
  const diasEntrenados = useMemo(() => {
    if (!sesiones) return new Set<string>()
    return new Set(
      sesiones.map(s => new Date(s.fecha).toISOString().split('T')[0])
    )
  }, [sesiones])

  // Racha actual (días consecutivos de entrenamiento, omitiendo fines de semana)
  const racha = useMemo(() => {
    if (diasEntrenados.size === 0) return 0
    let contador = 0
    const hoy = new Date()
    for (let i = 0; i < 365; i++) {
      const dia = new Date(hoy)
      dia.setDate(hoy.getDate() - i)
      const iso = dia.toISOString().split('T')[0]
      const diaSemana = dia.getDay()
      // Fines de semana son descanso, no rompen racha
      if (diaSemana === 0 || diaSemana === 6) continue
      if (diasEntrenados.has(iso)) contador++
      else break
    }
    return contador
  }, [diasEntrenados])

  // Resumen de la semana actual (Lun-Vie)
  const resumenSemana = useMemo<ResumenDia[]>(() => {
    const hoy = new Date()
    const diaSemanaHoy = hoy.getDay()
    const lunes = new Date(hoy)
    const diff = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy
    lunes.setDate(hoy.getDate() + diff)
    lunes.setHours(0, 0, 0, 0)

    const diasOffset = [1, 2, 3, 4, 5]
    return diasOffset.map((offset, idx) => {
      const dia = new Date(lunes)
      dia.setDate(lunes.getDate() + offset - 1)
      const iso = dia.toISOString().split('T')[0]
      const esHoy = iso === hoy.toISOString().split('T')[0]
      return {
        nombre: DIAS_SEMANA_CORTOS[idx],
        completado: diasEntrenados.has(iso),
        esFuturo: dia > hoy && !esHoy,
        esHoy
      }
    })
  }, [diasEntrenados])

  const semanaCompletas = resumenSemana.filter(d => d.completado).length
  const semanaPlaneadas = resumenSemana.filter(d => !d.esFuturo).length

  return {
    diasEntrenadosSize: diasEntrenados.size,
    racha,
    resumenSemana,
    semanaCompletas,
    semanaPlaneadas
  }
}

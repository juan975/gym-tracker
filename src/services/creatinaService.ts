import { db } from '../db/database'
import { syncService } from './syncService'

export function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDiasDelMes(año: number, mes: number): Date[] {
  const dias: Date[] = []
  const totalDias = new Date(año, mes + 1, 0).getDate()
  for (let d = 1; d <= totalDias; d++) {
    dias.push(new Date(año, mes, d))
  }
  return dias
}

export const creatinaService = {
  toggleDia: async (fecha: string, userId?: string | null) => {
    const existente = await db.creatina.where('fecha').equals(fecha).first()
    if (existente) {
      await db.creatina.update(existente.id!, { tomada: !existente.tomada, updatedAt: Date.now() })
    } else {
      await db.creatina.add({ fecha, tomada: true, updatedAt: Date.now() })
    }

    // Sync a Firestore
    if (userId) {
      try {
        await syncService.sincronizarCreatina(userId, fecha)
      } catch (err) {
        console.error('Error sincronizando creatina:', err)
      }
    }
  },

  calcularRacha: (fechasTomadas: Set<string>): number => {
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
  },

  calcularStatsDelMes: (diasDelMes: Date[], fechasTomadas: Set<string>) => {
    const hoy = new Date()
    const diasMesISO = diasDelMes.map(d => toISO(d))
    const hoyISO = toISO(hoy)
    
    const tomados = diasMesISO.filter(d => fechasTomadas.has(d)).length
    const diasTranscurridos = diasMesISO.filter(d => d <= hoyISO).length
    const porcentaje = diasTranscurridos > 0 ? Math.round((tomados / diasTranscurridos) * 100) : 0
    
    return { tomados, diasTranscurridos, porcentaje }
  }
}

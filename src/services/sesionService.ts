import { db } from '../db/database'
import type { SetsMap } from '../types'

export const sesionService = {
  finalizarSesion: async (
    rutinaId: number, 
    setsCache: SetsMap, 
    sesionIdPersonalizada: number | null
  ) => {
    return db.transaction('rw', db.sesiones, db.setsRegistrados, async () => {
      let sesionId: number

      if (sesionIdPersonalizada) {
        // Sesión personalizada: ya existe, la marcamos completada
        await db.sesiones.update(sesionIdPersonalizada, { completada: true })
        sesionId = sesionIdPersonalizada
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
      
      return sesionId
    })
  },

  borrarSesion: async (sesionId: number) => {
    return db.transaction('rw', db.sesiones, db.setsRegistrados, db.ejerciciosSesion, async () => {
      await db.setsRegistrados.where('sesionId').equals(sesionId).delete()
      await db.ejerciciosSesion.where('sesionId').equals(sesionId).delete()
      await db.sesiones.delete(sesionId)
    })
  },

  limpiarSesionesHuerfanas: async () => {
    const todas = await db.sesiones.toArray()
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const huerfanas = todas.filter(
      s => !s.completada && new Date(s.fecha) < hace24h
    )
    if (huerfanas.length > 0) {
      const ids = huerfanas.map(s => s.id!).filter(Boolean)
      await db.transaction('rw', db.sesiones, db.setsRegistrados, db.ejerciciosSesion, async () => {
        for (const id of ids) {
          await db.setsRegistrados.where('sesionId').equals(id).delete()
          await db.ejerciciosSesion.where('sesionId').equals(id).delete()
        }
        await db.sesiones.bulkDelete(ids)
      })
    }
  }
}

import { db } from '../db/database'
import { syncService } from './syncService'
import type { SetsMap } from '../types'

export const sesionService = {
  finalizarSesion: async (
    rutinaId: number, 
    setsCache: SetsMap, 
    sesionIdPersonalizada: number | null,
    userId?: string | null
  ) => {
    const sesionId = await db.transaction('rw', db.sesiones, db.setsRegistrados, async () => {
      let sid: number

      if (sesionIdPersonalizada) {
        // Sesión personalizada: ya existe, la marcamos completada
        await db.sesiones.update(sesionIdPersonalizada, { completada: true, updatedAt: Date.now() })
        sid = sesionIdPersonalizada
      } else {
        // Sesión normal: crear nueva
        sid = await db.sesiones.add({
          rutinaId,
          fecha: new Date(),
          completada: true,
          personalizada: false,
          updatedAt: Date.now(),
        })
      }

      // Guardar todos los sets del cache
      const setsParaGuardar = Object.entries(setsCache)
        .map(([key, set]) => {
          const [ejId, numSet] = key.split('-').map(Number)
          return {
            sesionId: sid,
            ejercicioId: ejId,
            numeroSet: numSet,
            peso: set.peso,
            reps: set.reps,
            completado: set.completado,
            updatedAt: Date.now(),
          }
        })

      if (setsParaGuardar.length > 0) {
        await db.setsRegistrados.bulkAdd(setsParaGuardar)
      }
      
      return sid
    })

    // Sync batch a Firestore (solo al finalizar, no en cada write)
    if (userId) {
      try {
        await syncService.subirSesionCompleta(userId, sesionId)
      } catch (err) {
        console.error('Error sincronizando sesión a Firestore:', err)
        // No falla la operación local — se intentará de nuevo
      }
    }

    return sesionId
  },

  borrarSesion: async (sesionId: number, userId?: string | null) => {
    // Sync a Firestore primero (necesitamos los datos antes de borrar)
    if (userId) {
      try {
        await syncService.borrarSesion(userId, sesionId)
      } catch (err) {
        console.error('Error borrando sesión de Firestore:', err)
      }
    }

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

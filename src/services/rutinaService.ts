import { db } from '../db/database'
import { syncService } from './syncService'

export const rutinaService = {
  /**
   * Sube una rutina existente (y sus ejercicios) a Firestore.
   */
  async sincronizarRutina(rutinaId: number, userId?: string | null) {
    if (!userId) return
    try {
      await syncService.subirRutina(userId, rutinaId)
    } catch (err) {
      console.error('Error sincronizando rutina:', err)
    }
  },

  /**
   * Sincroniza todas las rutinas existentes que aún no tienen firestoreId.
   */
  async sincronizarTodasLasRutinas(userId: string) {
    const rutinas = await db.rutinas.toArray()
    for (const rutina of rutinas) {
      if (!rutina.firestoreId) {
        await syncService.subirRutina(userId, rutina.id!)
      }
    }
  },

  /**
   * Borra una rutina y sincroniza con Firestore.
   */
  async borrarRutina(rutinaId: number, userId?: string | null) {
    if (userId) {
      try {
        await syncService.borrarRutina(userId, rutinaId)
      } catch (err) {
        console.error('Error borrando rutina de Firestore:', err)
      }
    }

    await db.transaction('rw', db.rutinas, db.ejercicios, async () => {
      await db.ejercicios.where('rutinaId').equals(rutinaId).delete()
      await db.rutinas.delete(rutinaId)
    })
  },

  /**
   * Después de guardar ejercicios editados permanentemente, sincroniza.
   */
  async sincronizarDespuesDeEdicion(rutinaId: number, userId?: string | null) {
    if (!userId) return
    try {
      await syncService.subirRutina(userId, rutinaId)
    } catch (err) {
      console.error('Error sincronizando edición de rutina:', err)
    }
  },
}

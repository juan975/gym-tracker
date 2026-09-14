import Dexie, { type Table } from 'dexie'

export interface Rutina {
  id?: number
  nombre: string
  dia?: string
  grupoMuscular?: string
  creadaEn: Date
}

export interface Ejercicio {
  id?: number
  rutinaId: number
  nombre: string
  setsObjetivo: number
  repsObjetivo: string
  notas?: string
  orden: number
}

// Nuevo: override temporal por sesión
export interface EjercicioSesion {
  id?: number
  sesionId: number
  ejercicioBaseId?: number   // null si es un ejercicio agregado en la sesión
  nombre: string
  setsObjetivo: number
  repsObjetivo: string
  notas?: string
  orden: number
}

export interface Sesion {
  id?: number
  rutinaId: number
  fecha: Date
  completada: boolean
  personalizada: boolean     // true si se editó la rutina solo para esta sesión
}

export interface SetRegistrado {
  id?: number
  sesionId: number
  ejercicioId: number        // apunta a Ejercicio o EjercicioSesion según personalizada
  numeroSet: number
  peso: number
  reps: number
  completado: boolean
}

export interface RegistroCreatina {
  id?: number
  fecha: string              // ISO date string 'YYYY-MM-DD' (una entrada por día)
  tomada: boolean
}

class GymDatabase extends Dexie {
  rutinas!: Table<Rutina, number>
  ejercicios!: Table<Ejercicio, number>
  ejerciciosSesion!: Table<EjercicioSesion, number>
  sesiones!: Table<Sesion, number>
  setsRegistrados!: Table<SetRegistrado, number>
  creatina!: Table<RegistroCreatina, number>

  constructor() {
    super('GymTrackerDB')
    this.version(2).stores({
      rutinas: '++id, nombre, dia, creadaEn',
      ejercicios: '++id, rutinaId, orden',
      ejerciciosSesion: '++id, sesionId, orden',
      sesiones: '++id, rutinaId, fecha, completada',
      setsRegistrados: '++id, sesionId, ejercicioId'
    })
    this.version(3).stores({
      rutinas: '++id, nombre, dia, creadaEn',
      ejercicios: '++id, rutinaId, orden',
      ejerciciosSesion: '++id, sesionId, orden',
      sesiones: '++id, rutinaId, fecha, completada',
      setsRegistrados: '++id, sesionId, ejercicioId',
      creatina: '++id, &fecha, tomada'
    })
  }
}

export const db = new GymDatabase()
import Dexie, { type Table } from 'dexie'

export interface Rutina {
  id?: number
  nombre: string
  dia?: string
  grupoMuscular?: string
  creadaEn: Date
  firestoreId?: string
  updatedAt?: number
}

export interface Ejercicio {
  id?: number
  rutinaId: number
  nombre: string
  setsObjetivo: number
  repsObjetivo: string
  notas?: string
  orden: number
  firestoreId?: string
  updatedAt?: number
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
  firestoreId?: string
  updatedAt?: number
}

export interface Sesion {
  id?: number
  rutinaId: number
  fecha: Date
  completada: boolean
  personalizada: boolean     // true si se editó la rutina solo para esta sesión
  firestoreId?: string
  updatedAt?: number
}

export interface SetRegistrado {
  id?: number
  sesionId: number
  ejercicioId: number        // apunta a Ejercicio o EjercicioSesion según personalizada
  numeroSet: number
  peso: number
  reps: number
  completado: boolean
  firestoreId?: string
  updatedAt?: number
}

export interface RegistroCreatina {
  id?: number
  fecha: string              // ISO date string 'YYYY-MM-DD' (una entrada por día)
  tomada: boolean
  firestoreId?: string
  updatedAt?: number
}

export interface Preferencia {
  id?: number
  clave: string
  valor: string              // JSON serializado
}

class GymDatabase extends Dexie {
  rutinas!: Table<Rutina, number>
  ejercicios!: Table<Ejercicio, number>
  ejerciciosSesion!: Table<EjercicioSesion, number>
  sesiones!: Table<Sesion, number>
  setsRegistrados!: Table<SetRegistrado, number>
  creatina!: Table<RegistroCreatina, number>
  preferencias!: Table<Preferencia, number>

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
    // v4: Agregar campos de sync con Firestore + tabla de preferencias
    this.version(4).stores({
      rutinas: '++id, nombre, dia, creadaEn, firestoreId',
      ejercicios: '++id, rutinaId, orden, firestoreId',
      ejerciciosSesion: '++id, sesionId, orden, firestoreId',
      sesiones: '++id, rutinaId, fecha, completada, firestoreId',
      setsRegistrados: '++id, sesionId, ejercicioId, firestoreId',
      creatina: '++id, &fecha, tomada, firestoreId',
      preferencias: '++id, &clave'
    })
  }
}

export const db = new GymDatabase()
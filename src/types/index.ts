export interface SetCache {
  peso: number
  reps: number
  completado: boolean
}

export type SetsMap = Record<string, SetCache> // key: "ejercicioId-numeroSet"

export interface ResumenDia {
  nombre: string
  completado: boolean
  esFuturo: boolean
  esHoy: boolean
}

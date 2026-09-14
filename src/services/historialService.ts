export const historialService = {
  getPreviewEjercicios: (
    ejerciciosFuente: any[], 
    setsCompletados: any[]
  ) => {
    return ejerciciosFuente.map(ej => {
      const setsDelEj = setsCompletados.filter(s => s.ejercicioId === ej.id)
      if (setsDelEj.length === 0) return null
      const mejorSet = setsDelEj.reduce((best, s) =>
        s.peso > best.peso ? s : best
      , setsDelEj[0])
      return {
        nombre: ej.nombre,
        pesoMax: mejorSet.peso,
        reps: mejorSet.reps
      }
    }).filter(Boolean) as { nombre: string; pesoMax: number; reps: number }[]
  }
}

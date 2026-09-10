export function getRangoPeso(grupoMuscular?: string): { max: number; salto: number } {
  const gm = (grupoMuscular ?? '').toLowerCase()
  const esPierna = gm.includes('pierna') || gm.includes('glúteo') || gm.includes('gluteo') || gm.includes('femoral')
  
  return esPierna
    ? { max: 300, salto: 5 }
    : { max: 150, salto: 2 }
}
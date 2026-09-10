// "8-10" → 10, "12" → 12, "10 (por lado)" → 10, "6-8" → 8
export function getRepsObjetivo(reps: string): number {
  const numeros = reps.match(/\d+/g)
  if (!numeros || numeros.length === 0) return 10
  return Math.max(...numeros.map(Number))
}
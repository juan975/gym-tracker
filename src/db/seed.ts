import { db } from './database'

interface EjercicioSeed {
  nombre: string
  sets: number
  reps: string
  notas: string
}

interface RutinaSeed {
  dia: string
  grupoMuscular: string
  ejercicios: EjercicioSeed[]
}

const rutinasSeed: RutinaSeed[] = [
  {
    dia: 'Lunes',
    grupoMuscular: 'Pecho y Tríceps',
    ejercicios: [
      { nombre: 'Press inclinado con mancuernas', sets: 4, reps: '8-10', notas: 'Pectoral superior (Movimiento pesado)' },
      { nombre: 'Press de pecho en máquina o plano', sets: 3, reps: '10-12', notas: 'Pectoral medio (Hipertrofia / Estabilidad)' },
      { nombre: 'Aperturas en polea o Pec Deck', sets: 3, reps: '12-15', notas: 'Aislamiento (Tensión constante en estiramiento)' },
      { nombre: 'Extensión de tríceps en polea con cuerda', sets: 4, reps: '12', notas: 'Cabeza lateral y medial (Énfasis en contracción)' },
      { nombre: 'Copa de tríceps sentado con mancuerna', sets: 3, reps: '10-12', notas: 'Cabeza larga (Máximo estiramiento / Codos fijos)' },
    ]
  },
  {
    dia: 'Martes',
    grupoMuscular: 'Pierna (Cuádriceps)',
    ejercicios: [
      { nombre: 'Sentadilla libre con barra o Sentadilla Hack', sets: 4, reps: '6-8', notas: 'Fuerza general y masa en cuádriceps (Pesado)' },
      { nombre: 'Prensa de piernas', sets: 3, reps: '10-12', notas: 'Pies abajo en plataforma para priorizar cuádriceps' },
      { nombre: 'Extensiones de cuádriceps en máquina', sets: 3, reps: '12-15', notas: 'Aislamiento total / Quemazón y estrés metabólico' },
      { nombre: 'Elevación de talones (Pantorrillas)', sets: 4, reps: '15', notas: 'Controlado, con pausa de 1 segundo abajo' },
    ]
  },
  {
    dia: 'Miércoles',
    grupoMuscular: 'Espalda y Bíceps',
    ejercicios: [
      { nombre: 'Jalón al pecho abierto en polea', sets: 4, reps: '10', notas: '[Amplitud] Dorsal ancho superior (Enfoque en bajar con codos)' },
      { nombre: 'Remo en máquina T (apoyo en pecho)', sets: 4, reps: '8-10', notas: '[Densidad] Espalda alta, romboides y trapecios (Grosor)' },
      { nombre: 'Jalón agarre neutro (Barra en V)', sets: 3, reps: '10-12', notas: '[Amplitud] Dorsal bajo (Lleva el agarre hacia el pecho inferior)' },
      { nombre: 'Remo unilateral con mancuerna', sets: 3, reps: '10 (por lado)', notas: '[Densidad] Corrección de asimetrías y pico de contracción' },
      { nombre: 'Curl de bíceps alterno con mancuernas', sets: 4, reps: '10 (por brazo)', notas: 'Flexión con rotación de muñeca (Supinación)' },
      { nombre: 'Curl predicador en banco o máquina', sets: 3, reps: '12', notas: 'Aislamiento estricto (Evita balanceos con el cuerpo)' },
    ]
  },
  {
    dia: 'Jueves',
    grupoMuscular: 'Glúteo y Femoral',
    ejercicios: [
      { nombre: 'Hip Thrust con barra', sets: 4, reps: '8-10', notas: 'Glúteo mayor (Sostén 1 segundo arriba la contracción)' },
      { nombre: 'Peso muerto rumano (mancuernas o barra)', sets: 4, reps: '10', notas: 'Estiramiento profundo de femorales y glúteos' },
      { nombre: 'Curl de piernas acostado o sentado', sets: 3, reps: '12', notas: 'Aislamiento de la flexión de rodilla para femoral' },
      { nombre: 'Zancadas caminando o Sentadilla Búlgara', sets: 3, reps: '12 (por pierna)', notas: 'Trabajo unilateral estético y gran quema calórica' },
    ]
  },
  {
    dia: 'Viernes',
    grupoMuscular: 'Hombro y Brazos',
    ejercicios: [
      { nombre: 'Press militar sentado con mancuernas', sets: 4, reps: '8-10', notas: 'Hombro anterior y fuerza general de empuje superior' },
      { nombre: 'Elevaciones laterales (mancuernas o polea)', sets: 4, reps: '12-15', notas: 'Hombro medio (Ancho de hombros / Aspecto atlético)' },
      { nombre: 'Deltoides posterior en máquina (Pec Deck inv.)', sets: 3, reps: '12-15', notas: 'Hombro posterior (Salud articular y efecto 3D)' },
      { nombre: 'Curl Martillo con mancuernas', sets: 3, reps: '10-12', notas: 'Braquial y antebrazo (Grosor lateral del brazo)' },
      { nombre: 'Extensión de tríceps unilateral en polea', sets: 3, reps: '12 (por brazo)', notas: 'Cabeza larga por encima de la cabeza / Simetría' },
    ]
  },
]

export async function cargarRutinaBase() {
  // Verifica si ya hay rutinas para no duplicar
  const existentes = await db.rutinas.count()
  if (existentes > 0) return { yaExiste: true }

  const ahora = new Date()

  for (const rutina of rutinasSeed) {
    const rutinaId = await db.rutinas.add({
      nombre: `${rutina.dia} - ${rutina.grupoMuscular}`,
      dia: rutina.dia,
      grupoMuscular: rutina.grupoMuscular,
      creadaEn: ahora
    })

    const ejerciciosConOrden = rutina.ejercicios.map((ej, idx) => ({
      rutinaId,
      nombre: ej.nombre,
      setsObjetivo: ej.sets,
      repsObjetivo: ej.reps,
      notas: ej.notas,
      orden: idx + 1
    }))

    await db.ejercicios.bulkAdd(ejerciciosConOrden)
  }

  return { yaExiste: false, creadas: rutinasSeed.length }
}
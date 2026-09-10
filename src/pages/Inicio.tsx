import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import DescansoDia from './DescansoDia'
import RutinaDetalle from './RutinaDetalle'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Inicio() {
  const navigate = useNavigate()
  const hoy = new Date().getDay()
  const nombreDia = DIAS[hoy]
  const esDescanso = hoy === 0 || hoy === 6

  const rutinaHoy = useLiveQuery(async () => {
    if (esDescanso) return null
    return await db.rutinas.where('dia').equals(nombreDia).first() ?? null
  }, [nombreDia, esDescanso])

  if (esDescanso) {
    return <DescansoDia dia={nombreDia} />
  }

  if (rutinaHoy === undefined) {
    return <div className="p-6 pt-8 text-slate-500 text-center">Cargando...</div>
  }

  if (!rutinaHoy) {
    return (
      <div className="p-6 pt-8">
        <p className="text-slate-500 text-center mb-4">
          No hay rutina configurada para {nombreDia}.
        </p>
        <button
          onClick={() => navigate('/rutinas')}
          className="neu-button px-5 py-3 mx-auto block text-slate-700 font-medium"
        >
          Ver todas las rutinas
        </button>
      </div>
    )
  }

  return <RutinaDetalle rutinaId={rutinaHoy.id} hideBackButton />
}
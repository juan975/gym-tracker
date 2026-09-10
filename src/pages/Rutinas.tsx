import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Download, ChevronRight } from 'lucide-react'
import { db } from '../db/database'
import { cargarRutinaBase } from '../db/seed'

export default function Rutinas() {
  const rutinas = useLiveQuery(() => 
    db.rutinas.orderBy('creadaEn').toArray()
  )
  const navigate = useNavigate()
  const handleCargarRutina = async () => {
    const resultado = await cargarRutinaBase()
    if (resultado.yaExiste) {
      alert('Ya tienes rutinas cargadas.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8 pt-6">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Bienvenido</p>
          <h1 className="text-3xl font-bold text-slate-700 mt-1">Mis Rutinas</h1>
        </div>
        <button className="neu-button p-4">
          <Plus size={22} className="text-slate-600" />
        </button>
      </div>

      {rutinas === undefined ? (
        <p className="text-slate-500 text-center">Cargando...</p>
      ) : rutinas.length === 0 ? (
        <div className="neu-inset p-8 text-center">
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Aún no tienes rutinas guardadas.
          </p>
          <button 
            onClick={handleCargarRutina}
            className="neu-button px-5 py-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <Download size={18} />
            Cargar mi rutina semanal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rutinas.map((rutina) => (
            <button 
              key={rutina.id}
              onClick={() => navigate(`/rutina/${rutina.id}`)}
              className="neu-raised w-full p-5 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                  {rutina.dia}
                </p>
                <h3 className="text-lg font-semibold text-slate-700 mt-1">
                  {rutina.grupoMuscular}
                </h3>
              </div>
              <ChevronRight size={22} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
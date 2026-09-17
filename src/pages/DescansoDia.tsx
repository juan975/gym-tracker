import { useNavigate } from 'react-router-dom'
import { Moon, List } from 'lucide-react'
import PageHeader from '../components/PageHeader'

export default function DescansoDia({ dia }: { dia: string }) {
  const navigate = useNavigate()

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <PageHeader 
        titulo="Día de descanso" 
        mostrarBienvenida={true} 
      />
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="neu-raised w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <Moon size={40} className="text-slate-500" />
        </div>
        
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-2">
          {dia}
        </p>
      <h1 className="text-3xl font-bold text-slate-700 mb-3 text-center">
        Día de descanso
      </h1>
      <p className="text-slate-500 text-sm text-center max-w-xs mb-8 leading-relaxed">
        Hoy toca recuperar. Tu cuerpo construye músculo mientras descansas.
      </p>

        <button 
          onClick={() => navigate('/rutinas')}
          className="neu-button px-5 py-3 flex items-center gap-2 text-slate-700 font-medium"
        >
          <List size={18} />
          Ver todas las rutinas
        </button>
      </div>
    </div>
  )
}
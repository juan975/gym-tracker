import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { firestore } from '../firebase/config'
import { useAuth } from './AuthContext'

interface Secciones {
  creatina: boolean
  historial: boolean
}

interface PreferenciasData {
  nombre: string
  apellido: string
  email: string
  tema: 'claro' | 'oscuro'
  secciones: Secciones
}

interface PreferenciasContextType {
  preferencias: PreferenciasData | null
  loading: boolean
  actualizarPreferencias: (updates: Partial<PreferenciasData>) => Promise<void>
}

// Obtener tema inicial de localStorage si existe
const getInitialTheme = () => {
  return (localStorage.getItem('gym_tracker_theme') as 'claro' | 'oscuro') || 'claro'
}

const defaultPreferencias: PreferenciasData = {
  nombre: '',
  apellido: '',
  email: '',
  tema: getInitialTheme(),
  secciones: { creatina: true, historial: true },
}

const PreferenciasContext = createContext<PreferenciasContextType>({
  preferencias: null,
  loading: true,
  actualizarPreferencias: async () => {},
})

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [preferencias, setPreferencias] = useState<PreferenciasData | null>(null)
  const [loading, setLoading] = useState(true)

  // Escuchar cambios en preferencias de Firestore en tiempo real
  useEffect(() => {
    if (!user) {
      setPreferencias(null)
      setLoading(false)
      return
    }

    const docRef = doc(firestore, 'users', user.uid, 'preferencias', 'config')
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const newTema = data.tema || getInitialTheme()
        
        setPreferencias({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          email: data.email || user.email || '',
          tema: newTema,
          secciones: {
            creatina: data.secciones?.creatina ?? true,
            historial: data.secciones?.historial ?? true,
          },
        })
        
        // Guardar en localStorage para persistencia al cerrar sesión
        localStorage.setItem('gym_tracker_theme', newTema)
      } else {
        setPreferencias(defaultPreferencias)
      }
      setLoading(false)
    }, (err) => {
      console.error('Error escuchando preferencias:', err)
      setPreferencias(defaultPreferencias)
      setLoading(false)
    })

    return unsub
  }, [user])

  // Aplicar tema al body
  useEffect(() => {
    // Si no hay preferencias (ej. usuario no logueado), usamos localStorage
    const temaActivo = preferencias?.tema || getInitialTheme()
    document.documentElement.setAttribute('data-theme', temaActivo)
  }, [preferencias?.tema])

  const actualizarPreferencias = async (updates: Partial<PreferenciasData>) => {
    if (!user || !preferencias) return

    const newPrefs = { ...preferencias, ...updates }
    // Si actualizan secciones, hacer merge
    if (updates.secciones) {
      newPrefs.secciones = { ...preferencias.secciones, ...updates.secciones }
    }
    setPreferencias(newPrefs)

    if (updates.tema) {
      localStorage.setItem('gym_tracker_theme', updates.tema)
    }

    try {
      const docRef = doc(firestore, 'users', user.uid, 'preferencias', 'config')
      await setDoc(docRef, {
        ...newPrefs,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
    } catch (err) {
      console.error('Error guardando preferencias:', err)
    }
  }

  return (
    <PreferenciasContext.Provider value={{ preferencias, loading, actualizarPreferencias }}>
      {children}
    </PreferenciasContext.Provider>
  )
}

export const usePreferencias = () => useContext(PreferenciasContext)

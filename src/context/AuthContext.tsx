import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthChange } from '../firebase/auth'
import { firestore } from '../firebase/config'
import { syncService } from '../services/syncService'

interface PerfilUsuario {
  nombre: string
  apellido: string
  email: string
}

interface AuthContextType {
  user: User | null
  perfil: PerfilUsuario | null
  loading: boolean
  perfilCompleto: boolean
  refrescarPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  loading: true,
  perfilCompleto: false,
  refrescarPerfil: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [perfilCompleto, setPerfilCompleto] = useState(false)

  const cargarPerfil = async (uid: string) => {
    try {
      const docRef = doc(firestore, 'users', uid, 'preferencias', 'config')
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        setPerfil({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          email: data.email || '',
        })
        setPerfilCompleto(true)
      } else {
        setPerfil(null)
        setPerfilCompleto(false)
      }
    } catch (err) {
      console.error('Error cargando perfil:', err)
      setPerfil(null)
      setPerfilCompleto(false)
    }
  }

  const refrescarPerfil = async () => {
    if (user) {
      await cargarPerfil(user.uid)
    }
  }

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await cargarPerfil(firebaseUser.uid)

        // Iniciar sincronización con Firestore
        syncService.init(firebaseUser.uid)

        // Migración one-shot de datos locales (si Firestore está vacío)
        try {
          const migrado = await syncService.migrarDatosLocales(firebaseUser.uid)
          if (migrado) {
            console.log('Datos locales migrados a Firestore exitosamente')
          }
        } catch (err) {
          console.error('Error en migración de datos:', err)
        }
      } else {
        setPerfil(null)
        setPerfilCompleto(false)
        syncService.stop()
      }
      setLoading(false)
    })
    return () => {
      unsub()
      syncService.stop()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, perfil, loading, perfilCompleto, refrescarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

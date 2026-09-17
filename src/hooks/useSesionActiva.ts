import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sesionService } from '../services/sesionService'
import type { SetsMap, SetCache } from '../types'

function getStorageKey(rutinaId: number, sesionIdParam: string | null) {
  return `sesion-activa-${rutinaId}${sesionIdParam ? `-${sesionIdParam}` : ''}`
}

function guardarEnStorage(key: string, data: SetsMap) {
  try { sessionStorage.setItem(key, JSON.stringify(data)) } catch {}
}

function cargarDeStorage(key: string): SetsMap | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function limpiarStorage(key: string) {
  try { sessionStorage.removeItem(key) } catch {}
}

export function useSesionActiva(rutinaId: number, sesionIdParam: string | null, userId?: string | null) {
  const navigate = useNavigate()
  const storageKey = getStorageKey(rutinaId, sesionIdParam)
  
  const [setsCache, setSetsCache] = useState<SetsMap>(() => cargarDeStorage(storageKey) ?? {})
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false)
  const hayDatos = Object.keys(setsCache).length > 0

  useEffect(() => {
    guardarEnStorage(storageKey, setsCache)
  }, [setsCache, storageKey])

  // Protección beforeunload
  useEffect(() => {
    if (!hayDatos) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hayDatos])

  // Protección popstate (botón atrás)
  useEffect(() => {
    if (!hayDatos) return
    window.history.pushState({ sesionActiva: true }, '')
    const handlePopState = () => {
      setMostrarModalSalida(true)
      window.history.pushState({ sesionActiva: true }, '')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [hayDatos])

  const getSet = (ejercicioId: number, numeroSet: number): SetCache | undefined => {
    return setsCache[`${ejercicioId}-${numeroSet}`]
  }

  const actualizarSet = (ejercicioId: number, numeroSet: number, peso: number, reps: number, completado: boolean) => {
    setSetsCache(prev => ({
      ...prev,
      [`${ejercicioId}-${numeroSet}`]: { peso, reps, completado }
    }))
  }

  const finalizarSesion = async (ejerciciosLength: number) => {
    if (ejerciciosLength === 0) return

    const sesionIdParaEjercicios = sesionIdParam ? Number(sesionIdParam) : null
    
    await sesionService.finalizarSesion(rutinaId, setsCache, sesionIdParaEjercicios, userId)
    
    limpiarStorage(storageKey)
    setSetsCache({})
    navigate('/historial')
  }

  const confirmarSalida = () => {
    limpiarStorage(storageKey)
    setSetsCache({})
    setMostrarModalSalida(false)
    navigate(-1)
  }

  const cancelarSalida = () => setMostrarModalSalida(false)

  const handleVolver = () => {
    if (hayDatos) setMostrarModalSalida(true)
    else navigate(-1)
  }

  const setsCompletados = Object.values(setsCache).filter(s => s.completado).length

  return {
    setsCache,
    hayDatos,
    mostrarModalSalida,
    getSet,
    actualizarSet,
    finalizarSesion,
    confirmarSalida,
    cancelarSalida,
    handleVolver,
    setsCompletados
  }
}

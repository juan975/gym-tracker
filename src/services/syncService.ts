import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  query,
  type Unsubscribe,
} from 'firebase/firestore'
import { firestore } from '../firebase/config'
import { db } from '../db/database'

// --- Helpers ---

function userCol(userId: string, colName: string) {
  return collection(firestore, 'users', userId, colName)
}

function userDoc(userId: string, colName: string, docId: string) {
  return doc(firestore, 'users', userId, colName, docId)
}

function genId() {
  return doc(collection(firestore, '_')).id
}

// --- Estado del servicio ---

let activeUserId: string | null = null
const unsubscribers: Unsubscribe[] = []

// --- Sync Service ---

export const syncService = {
  /**
   * Inicializa los listeners de Firestore para mantener Dexie sincronizado.
   * Se llama una vez al hacer login.
   */
  init(userId: string) {
    if (activeUserId === userId) return // ya inicializado
    this.stop()
    activeUserId = userId

    // Listener de rutinas
    unsubscribers.push(
      onSnapshot(userCol(userId, 'rutinas'), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data()
          const fsId = change.doc.id

          if (change.type === 'added' || change.type === 'modified') {
            const existing = await db.rutinas.where('firestoreId').equals(fsId).first()
            const rutinaData = {
              nombre: data.nombre,
              dia: data.dia,
              grupoMuscular: data.grupoMuscular,
              creadaEn: data.creadaEn?.toDate?.() ?? new Date(data.creadaEn),
              firestoreId: fsId,
              updatedAt: data.updatedAt ?? Date.now(),
            }
            if (existing) {
              await db.rutinas.update(existing.id!, rutinaData)
            } else {
              await db.rutinas.add(rutinaData)
            }
          } else if (change.type === 'removed') {
            const existing = await db.rutinas.where('firestoreId').equals(fsId).first()
            if (existing) await db.rutinas.delete(existing.id!)
          }
        }
      })
    )

    // Listener de ejercicios
    unsubscribers.push(
      onSnapshot(userCol(userId, 'ejercicios'), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data()
          const fsId = change.doc.id

          if (change.type === 'added' || change.type === 'modified') {
            const existing = await db.ejercicios.where('firestoreId').equals(fsId).first()
            // Necesitamos resolver el rutinaId local desde el firestoreId de la rutina
            const rutinaLocal = await db.rutinas.where('firestoreId').equals(data.rutinaFirestoreId).first()
            if (!rutinaLocal) continue // la rutina aún no llegó, se resolverá después

            const ejercicioData = {
              rutinaId: rutinaLocal.id!,
              nombre: data.nombre,
              setsObjetivo: data.setsObjetivo,
              repsObjetivo: data.repsObjetivo,
              notas: data.notas ?? '',
              orden: data.orden,
              firestoreId: fsId,
              updatedAt: data.updatedAt ?? Date.now(),
            }
            if (existing) {
              await db.ejercicios.update(existing.id!, ejercicioData)
            } else {
              await db.ejercicios.add(ejercicioData)
            }
          } else if (change.type === 'removed') {
            const existing = await db.ejercicios.where('firestoreId').equals(fsId).first()
            if (existing) await db.ejercicios.delete(existing.id!)
          }
        }
      })
    )

    // Listener de sesiones
    unsubscribers.push(
      onSnapshot(userCol(userId, 'sesiones'), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data()
          const fsId = change.doc.id

          if (change.type === 'added' || change.type === 'modified') {
            const existing = await db.sesiones.where('firestoreId').equals(fsId).first()
            const rutinaLocal = await db.rutinas.where('firestoreId').equals(data.rutinaFirestoreId).first()
            if (!rutinaLocal) continue

            const sesionData = {
              rutinaId: rutinaLocal.id!,
              fecha: data.fecha?.toDate?.() ?? new Date(data.fecha),
              completada: data.completada,
              personalizada: data.personalizada ?? false,
              firestoreId: fsId,
              updatedAt: data.updatedAt ?? Date.now(),
            }
            if (existing) {
              await db.sesiones.update(existing.id!, sesionData)
            } else {
              await db.sesiones.add(sesionData)
            }
          } else if (change.type === 'removed') {
            const existing = await db.sesiones.where('firestoreId').equals(fsId).first()
            if (existing) {
              await db.setsRegistrados.where('sesionId').equals(existing.id!).delete()
              await db.ejerciciosSesion.where('sesionId').equals(existing.id!).delete()
              await db.sesiones.delete(existing.id!)
            }
          }
        }
      })
    )

    // Listener de sets registrados
    unsubscribers.push(
      onSnapshot(userCol(userId, 'setsRegistrados'), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data()
          const fsId = change.doc.id

          if (change.type === 'added' || change.type === 'modified') {
            const existing = await db.setsRegistrados.where('firestoreId').equals(fsId).first()
            const sesionLocal = await db.sesiones.where('firestoreId').equals(data.sesionFirestoreId).first()
            if (!sesionLocal) continue

            const setData = {
              sesionId: sesionLocal.id!,
              ejercicioId: data.ejercicioId, // Este se mantiene como referencia numérica local
              numeroSet: data.numeroSet,
              peso: data.peso,
              reps: data.reps,
              completado: data.completado,
              firestoreId: fsId,
              updatedAt: data.updatedAt ?? Date.now(),
            }
            if (existing) {
              await db.setsRegistrados.update(existing.id!, setData)
            } else {
              await db.setsRegistrados.add(setData)
            }
          } else if (change.type === 'removed') {
            const existing = await db.setsRegistrados.where('firestoreId').equals(fsId).first()
            if (existing) await db.setsRegistrados.delete(existing.id!)
          }
        }
      })
    )

    // Listener de creatina
    unsubscribers.push(
      onSnapshot(userCol(userId, 'creatina'), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data()
          const fsId = change.doc.id

          if (change.type === 'added' || change.type === 'modified') {
            const existing = await db.creatina.where('firestoreId').equals(fsId).first()
            const creatinaData = {
              fecha: data.fecha,
              tomada: data.tomada,
              firestoreId: fsId,
              updatedAt: data.updatedAt ?? Date.now(),
            }
            if (existing) {
              await db.creatina.update(existing.id!, creatinaData)
            } else {
              // Verificar que no exista ya por fecha (evitar duplicados)
              const porFecha = await db.creatina.where('fecha').equals(data.fecha).first()
              if (porFecha) {
                await db.creatina.update(porFecha.id!, creatinaData)
              } else {
                await db.creatina.add(creatinaData)
              }
            }
          } else if (change.type === 'removed') {
            const existing = await db.creatina.where('firestoreId').equals(fsId).first()
            if (existing) await db.creatina.delete(existing.id!)
          }
        }
      })
    )
  },

  /**
   * Detiene todos los listeners.
   */
  stop() {
    unsubscribers.forEach(unsub => unsub())
    unsubscribers.length = 0
    activeUserId = null
  },

  /**
   * Sube una rutina con sus ejercicios a Firestore.
   */
  async subirRutina(userId: string, rutinaId: number) {
    const rutina = await db.rutinas.get(rutinaId)
    if (!rutina) return

    const fsId = rutina.firestoreId || genId()
    const now = Date.now()

    await setDoc(userDoc(userId, 'rutinas', fsId), {
      nombre: rutina.nombre,
      dia: rutina.dia ?? '',
      grupoMuscular: rutina.grupoMuscular ?? '',
      creadaEn: rutina.creadaEn,
      updatedAt: now,
    })

    // Actualizar firestoreId local
    if (!rutina.firestoreId) {
      await db.rutinas.update(rutinaId, { firestoreId: fsId, updatedAt: now })
    }

    // Subir ejercicios de esta rutina
    const ejercicios = await db.ejercicios.where('rutinaId').equals(rutinaId).toArray()
    for (const ej of ejercicios) {
      const ejFsId = ej.firestoreId || genId()
      await setDoc(userDoc(userId, 'ejercicios', ejFsId), {
        rutinaFirestoreId: fsId,
        nombre: ej.nombre,
        setsObjetivo: ej.setsObjetivo,
        repsObjetivo: ej.repsObjetivo,
        notas: ej.notas ?? '',
        orden: ej.orden,
        updatedAt: now,
      })
      if (!ej.firestoreId) {
        await db.ejercicios.update(ej.id!, { firestoreId: ejFsId, updatedAt: now })
      }
    }
  },

  /**
   * Borra una rutina y sus ejercicios de Firestore.
   */
  async borrarRutina(userId: string, rutinaId: number) {
    const rutina = await db.rutinas.get(rutinaId)
    if (!rutina?.firestoreId) return

    // Borrar ejercicios en Firestore
    const ejercicios = await db.ejercicios.where('rutinaId').equals(rutinaId).toArray()
    for (const ej of ejercicios) {
      if (ej.firestoreId) {
        await deleteDoc(userDoc(userId, 'ejercicios', ej.firestoreId))
      }
    }

    await deleteDoc(userDoc(userId, 'rutinas', rutina.firestoreId))
  },

  /**
   * Sube una sesión completa (sesión + sets) a Firestore en un batch.
   * Se llama SOLO al finalizar la sesión.
   */
  async subirSesionCompleta(userId: string, sesionId: number) {
    const sesion = await db.sesiones.get(sesionId)
    if (!sesion) return

    const rutina = await db.rutinas.get(sesion.rutinaId)
    if (!rutina?.firestoreId) return

    const batch = writeBatch(firestore)
    const now = Date.now()

    // Sesión
    const sesionFsId = sesion.firestoreId || genId()
    const sesionRef = userDoc(userId, 'sesiones', sesionFsId)
    batch.set(sesionRef, {
      rutinaFirestoreId: rutina.firestoreId,
      fecha: sesion.fecha,
      completada: sesion.completada,
      personalizada: sesion.personalizada,
      updatedAt: now,
    })

    // Sets
    const sets = await db.setsRegistrados.where('sesionId').equals(sesionId).toArray()
    for (const set of sets) {
      const setFsId = set.firestoreId || genId()
      const setRef = userDoc(userId, 'setsRegistrados', setFsId)
      batch.set(setRef, {
        sesionFirestoreId: sesionFsId,
        ejercicioId: set.ejercicioId,
        numeroSet: set.numeroSet,
        peso: set.peso,
        reps: set.reps,
        completado: set.completado,
        updatedAt: now,
      })
      // Actualizar firestoreId local del set
      if (!set.firestoreId) {
        await db.setsRegistrados.update(set.id!, { firestoreId: setFsId, updatedAt: now })
      }
    }

    // Ejercicios de sesión (si es personalizada)
    if (sesion.personalizada) {
      const ejSesion = await db.ejerciciosSesion.where('sesionId').equals(sesionId).toArray()
      for (const ej of ejSesion) {
        const ejFsId = ej.firestoreId || genId()
        const ejRef = userDoc(userId, 'ejerciciosSesion', ejFsId)
        batch.set(ejRef, {
          sesionFirestoreId: sesionFsId,
          ejercicioBaseId: ej.ejercicioBaseId ?? null,
          nombre: ej.nombre,
          setsObjetivo: ej.setsObjetivo,
          repsObjetivo: ej.repsObjetivo,
          notas: ej.notas ?? '',
          orden: ej.orden,
          updatedAt: now,
        })
        if (!ej.firestoreId) {
          await db.ejerciciosSesion.update(ej.id!, { firestoreId: ejFsId, updatedAt: now })
        }
      }
    }

    await batch.commit()

    // Actualizar firestoreId local de la sesión
    if (!sesion.firestoreId) {
      await db.sesiones.update(sesionId, { firestoreId: sesionFsId, updatedAt: now })
    }
  },

  /**
   * Borra una sesión de Firestore (sesión + sets + ejerciciosSesion).
   */
  async borrarSesion(userId: string, sesionId: number) {
    const sesion = await db.sesiones.get(sesionId)
    if (!sesion?.firestoreId) return

    const batch = writeBatch(firestore)

    // Borrar sets
    const sets = await db.setsRegistrados.where('sesionId').equals(sesionId).toArray()
    for (const set of sets) {
      if (set.firestoreId) {
        batch.delete(userDoc(userId, 'setsRegistrados', set.firestoreId))
      }
    }

    // Borrar ejercicios de sesión
    const ejSesion = await db.ejerciciosSesion.where('sesionId').equals(sesionId).toArray()
    for (const ej of ejSesion) {
      if (ej.firestoreId) {
        batch.delete(userDoc(userId, 'ejerciciosSesion', ej.firestoreId))
      }
    }

    // Borrar sesión
    batch.delete(userDoc(userId, 'sesiones', sesion.firestoreId))

    await batch.commit()
  },

  /**
   * Sincroniza un registro de creatina a Firestore.
   */
  async sincronizarCreatina(userId: string, fecha: string) {
    const registro = await db.creatina.where('fecha').equals(fecha).first()
    if (!registro) return

    const fsId = registro.firestoreId || genId()
    const now = Date.now()

    await setDoc(userDoc(userId, 'creatina', fsId), {
      fecha: registro.fecha,
      tomada: registro.tomada,
      updatedAt: now,
    })

    if (!registro.firestoreId) {
      await db.creatina.update(registro.id!, { firestoreId: fsId, updatedAt: now })
    }
  },

  /**
   * Migración one-shot: sube todos los datos locales de Dexie a Firestore.
   * Solo se ejecuta si Firestore está vacío para este usuario.
   */
  async migrarDatosLocales(userId: string) {
    // Verificar si ya hay datos en Firestore
    const rutinasSnap = await getDocs(query(userCol(userId, 'rutinas')))
    if (!rutinasSnap.empty) return false // Ya hay datos, no migrar

    const rutinas = await db.rutinas.toArray()
    if (rutinas.length === 0) return false // No hay nada que migrar

    const now = Date.now()

    // Subir rutinas y ejercicios
    for (const rutina of rutinas) {
      const fsId = genId()
      await setDoc(userDoc(userId, 'rutinas', fsId), {
        nombre: rutina.nombre,
        dia: rutina.dia ?? '',
        grupoMuscular: rutina.grupoMuscular ?? '',
        creadaEn: rutina.creadaEn,
        updatedAt: now,
      })
      await db.rutinas.update(rutina.id!, { firestoreId: fsId, updatedAt: now })

      const ejercicios = await db.ejercicios.where('rutinaId').equals(rutina.id!).toArray()
      for (const ej of ejercicios) {
        const ejFsId = genId()
        await setDoc(userDoc(userId, 'ejercicios', ejFsId), {
          rutinaFirestoreId: fsId,
          nombre: ej.nombre,
          setsObjetivo: ej.setsObjetivo,
          repsObjetivo: ej.repsObjetivo,
          notas: ej.notas ?? '',
          orden: ej.orden,
          updatedAt: now,
        })
        await db.ejercicios.update(ej.id!, { firestoreId: ejFsId, updatedAt: now })
      }
    }

    // Subir sesiones y sets
    const sesiones = await db.sesiones.filter(s => s.completada).toArray()
    for (const sesion of sesiones) {
      const rutina = await db.rutinas.get(sesion.rutinaId)
      if (!rutina?.firestoreId) continue

      const sesionFsId = genId()
      await setDoc(userDoc(userId, 'sesiones', sesionFsId), {
        rutinaFirestoreId: rutina.firestoreId,
        fecha: sesion.fecha,
        completada: sesion.completada,
        personalizada: sesion.personalizada,
        updatedAt: now,
      })
      await db.sesiones.update(sesion.id!, { firestoreId: sesionFsId, updatedAt: now })

      const sets = await db.setsRegistrados.where('sesionId').equals(sesion.id!).toArray()
      for (const set of sets) {
        const setFsId = genId()
        await setDoc(userDoc(userId, 'setsRegistrados', setFsId), {
          sesionFirestoreId: sesionFsId,
          ejercicioId: set.ejercicioId,
          numeroSet: set.numeroSet,
          peso: set.peso,
          reps: set.reps,
          completado: set.completado,
          updatedAt: now,
        })
        await db.setsRegistrados.update(set.id!, { firestoreId: setFsId, updatedAt: now })
      }
    }

    // Subir creatina
    const creatina = await db.creatina.toArray()
    for (const reg of creatina) {
      const crFsId = genId()
      await setDoc(userDoc(userId, 'creatina', crFsId), {
        fecha: reg.fecha,
        tomada: reg.tomada,
        updatedAt: now,
      })
      await db.creatina.update(reg.id!, { firestoreId: crFsId, updatedAt: now })
    }

    return true
  },
}

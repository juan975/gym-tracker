import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

export const registrarse = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const iniciarSesion = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const iniciarSesionGoogle = () =>
  signInWithPopup(auth, googleProvider)

export const cerrarSesion = () => signOut(auth)

export const onAuthChange = (callback: (user: User | null) => void): Unsubscribe =>
  onAuthStateChanged(auth, callback)

export const actualizarPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('No hay usuario autenticado')
  
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

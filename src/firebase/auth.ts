import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './config';

// Configurar el proveedor de Google
const googleProvider = new GoogleAuthProvider();

// Función para iniciar sesión con Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  }
};

// Función para cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

// Función para observar cambios en el estado de autenticación
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Obtener el usuario actual
export const getCurrentUser = () => {
  return auth.currentUser;
};


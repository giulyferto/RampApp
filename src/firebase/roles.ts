import { httpsCallable } from 'firebase/functions';
import { getCurrentUser } from './auth';
import { functions } from './config';

// Tipos para los roles
export type UserRole = 'admin' | 'user';

// Tipos para las respuestas de las Cloud Functions
interface SetUserRoleRequest {
  userId: string;
  role: UserRole;
}

interface SetUserRoleResponse {
  success: boolean;
  message: string;
}

interface GetUserRoleRequest {
  userId?: string;
}

interface GetUserRoleResponse {
  userId: string;
  role: UserRole;
}

interface UserInfo {
  uid: string;
  email: string | undefined;
  displayName: string | undefined;
  role: UserRole;
  createdAt: string;
}

interface ListUsersResponse {
  users: UserInfo[];
}

// Referencias a las Cloud Functions
const setUserRoleFunction = httpsCallable<SetUserRoleRequest, SetUserRoleResponse>(functions, 'setUserRole');
const getUserRoleFunction = httpsCallable<GetUserRoleRequest, GetUserRoleResponse>(functions, 'getUserRole');
const listUsersFunction = httpsCallable<unknown, ListUsersResponse>(functions, 'listUsers');

/**
 * Decodifica un JWT token (solo la parte del payload)
 * Nota: Esto es solo para lectura, no valida la firma
 */
const decodeToken = (token: string): { role?: UserRole; [key: string]: unknown } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};

/**
 * Obtiene el rol del usuario actual desde los Custom Claims del token
 * @returns El rol del usuario ('admin' o 'user'), o null si no está autenticado
 */
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    // Forzar la actualización del token para obtener los claims más recientes
    const token = await user.getIdToken(true);
    if (!token) {
      return null;
    }

    // Intentar leer el rol directamente del token decodificado
    const decodedToken = decodeToken(token);
    if (decodedToken && decodedToken.role) {
      console.log('✅ Rol obtenido del token:', decodedToken.role);
      return decodedToken.role as UserRole;
    }

    // Si no está en el token, intentar obtenerlo de la Cloud Function
    console.log('⚠️ Rol no encontrado en token, intentando Cloud Function...');
    const result = await getUserRoleFunction({ userId: user.uid });
    console.log('✅ Rol obtenido de Cloud Function:', result.data.role);
    return result.data.role;
  } catch (error) {
    console.error('❌ Error al obtener el rol del usuario:', error);
    // Si las funciones no están desplegadas, intentar leer del token sin forzar actualización
    try {
      const token = await user.getIdToken(false);
      if (token) {
        const decodedToken = decodeToken(token);
        if (decodedToken && decodedToken.role) {
          console.log('✅ Rol obtenido del token (sin actualizar):', decodedToken.role);
          return decodedToken.role as UserRole;
        }
      }
    } catch (tokenError) {
      console.error('Error al leer token:', tokenError);
    }
    return null;
  }
};

/**
 * Obtiene el rol de un usuario específico (solo para administradores)
 * @param userId - ID del usuario cuyo rol se quiere obtener
 * @returns El rol del usuario
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const result = await getUserRoleFunction({ userId });
    return result.data.role;
  } catch (error) {
    console.error('Error al obtener el rol del usuario:', error);
    throw error;
  }
};

/**
 * Establece el rol de un usuario (solo para administradores)
 * @param userId - ID del usuario cuyo rol se quiere cambiar
 * @param role - Nuevo rol ('admin' o 'user')
 */
export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    await setUserRoleFunction({ userId, role });
    // Nota: El usuario afectado necesitará cerrar sesión y volver a iniciar sesión
    // para que su token se actualice con el nuevo rol
  } catch (error) {
    console.error('Error al cambiar el rol del usuario:', error);
    throw error;
  }
};

/**
 * Lista todos los usuarios (solo para administradores)
 * @returns Lista de usuarios con sus roles
 */
export const listUsers = async (): Promise<UserInfo[]> => {
  try {
    const result = await listUsersFunction();
    return result.data.users;
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    throw error;
  }
};

/**
 * Verifica si el usuario actual es administrador
 * @returns true si el usuario es admin, false en caso contrario
 */
export const isAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === 'admin';
};

/**
 * Verifica si el usuario actual tiene un rol específico
 * @param role - Rol a verificar
 * @returns true si el usuario tiene ese rol
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
  const userRole = await getCurrentUserRole();
  return userRole === role;
};


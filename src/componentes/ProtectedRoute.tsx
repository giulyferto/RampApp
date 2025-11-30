import { ReactNode } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { getCurrentUser } from '../firebase/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
  fallback?: ReactNode;
}

/**
 * Componente que protege rutas basándose en el rol del usuario
 * @param children - Contenido a mostrar si el usuario tiene el rol requerido
 * @param requiredRole - Rol requerido ('admin' o 'user'). Por defecto 'user'
 * @param fallback - Contenido opcional a mostrar si el usuario no tiene el rol requerido
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole = 'user',
  fallback = null 
}: ProtectedRouteProps) => {
  const { role, isLoading } = useUserRole();
  const user = getCurrentUser();

  if (isLoading) {
    return null; // O puedes mostrar un spinner
  }

  if (!user) {
    return <>{fallback || <div>Debes iniciar sesión para acceder a esta página</div>}</>;
  }

  if (!role) {
    return <>{fallback || <div>Error al cargar el rol del usuario</div>}</>;
  }

  // Si se requiere admin, el usuario debe ser admin
  if (requiredRole === 'admin' && role !== 'admin') {
    return <>{fallback || <div>No tienes permisos para acceder a esta página</div>}</>;
  }

  // Si se requiere user, cualquier usuario autenticado puede acceder
  return <>{children}</>;
};


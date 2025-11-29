import { ReactNode } from 'react';
import { useUserRole } from '../hooks/useUserRole';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que solo muestra su contenido si el usuario es administrador
 * @param children - Contenido a mostrar si el usuario es admin
 * @param fallback - Contenido opcional a mostrar si el usuario no es admin
 */
export const AdminOnly = ({ children, fallback = null }: AdminOnlyProps) => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return null; // O puedes mostrar un spinner
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};


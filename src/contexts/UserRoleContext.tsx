import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getCurrentUserRole, type UserRole } from '../firebase/roles';
import type { User } from 'firebase/auth';

interface UserRoleContextType {
  role: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider = ({ children }: UserRoleProviderProps) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRole = async (user: User | null) => {
    if (user) {
      setIsLoading(true);
      try {
        const userRole = await getCurrentUserRole();
        setRole(userRole);
      } catch (error) {
        console.error('Error al cargar el rol:', error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setRole(null);
      setIsLoading(false);
    }
  };

  const refreshRole = async () => {
    const user = await new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthChange((user) => {
        unsubscribe();
        resolve(user);
      });
    });
    await loadRole(user);
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      await loadRole(user);
    });

    return () => unsubscribe();
  }, []);

  const value: UserRoleContextType = {
    role,
    isLoading,
    isAdmin: role === 'admin',
    refreshRole,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole debe ser usado dentro de un UserRoleProvider');
  }
  return context;
};


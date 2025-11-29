import { useEffect, useState } from 'react';
import { signInWithGoogle, logout, onAuthChange, getCurrentUser } from '../firebase/auth';
import type { User } from 'firebase/auth';
import logo from '../assets/LogoRampApp.svg';
import './Home.css';
import type { NavBarProps } from '../types';
import { useUserRole } from '../hooks/useUserRole';

const NavBar = ({ onShowSavedPoints, onShowAllPoints, onShowMyPoints, onShowPendingPoints, showOnlySavedPoints = false, showOnlyMyPoints = false, showPendingPoints = false }: NavBarProps) => {
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar
    setUser(getCurrentUser());

    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await logout();
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSavedPointsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (showOnlySavedPoints && onShowAllPoints) {
      onShowAllPoints();
    } else if (onShowSavedPoints) {
      onShowSavedPoints();
    }
  };

  const handleMyPointsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (showOnlyMyPoints && onShowAllPoints) {
      onShowAllPoints();
    } else if (onShowMyPoints) {
      onShowMyPoints();
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
  };

  const handleInicioClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if ((showOnlySavedPoints || showOnlyMyPoints || showPendingPoints) && onShowAllPoints) {
      onShowAllPoints();
    }
  };

  const handlePendingPointsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (showPendingPoints && onShowAllPoints) {
      onShowAllPoints();
    } else if (onShowPendingPoints) {
      onShowPendingPoints();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logo} alt="Logo RampApp" style={{ height: '50px', width: 'auto' }} />
          <h1 className="navbar-title">RampApp</h1>
        </div>
        <ul className="navbar-menu">
          <li>
            <a 
              href="/" 
              className={`navbar-link ${!showOnlySavedPoints && !showOnlyMyPoints && !showPendingPoints ? 'active' : ''}`}
              onClick={handleInicioClick}
            >
              Inicio
            </a>
          </li>
          {user && (
            <>
              <li>
                <a 
                  href="/" 
                  className={`navbar-link ${showOnlySavedPoints ? 'active' : ''}`}
                  onClick={handleSavedPointsClick}
                >
                  Puntos guardados
                </a>
              </li>
              <li>
                <a 
                  href="/" 
                  className={`navbar-link ${showOnlyMyPoints ? 'active' : ''}`}
                  onClick={handleMyPointsClick}
                >
                  Mis puntos
                </a>
              </li>
              {isAdmin && (
                <li>
                  <a 
                    href="/" 
                    className={`navbar-link ${showPendingPoints ? 'active' : ''}`}
                    onClick={handlePendingPointsClick}
                  >
                    Administrar puntos
                  </a>
                </li>
              )}
            </>
          )}
          <li><a href="/" className="navbar-link" onClick={handleLinkClick}>Info útil</a></li>
          {user ? (
            <li><a href="/" className="navbar-link" onClick={handleLogout}>Cerrar sesión</a></li>
          ) : (
            <li><a href="/" className="navbar-link" onClick={handleLogin}>Login</a></li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;


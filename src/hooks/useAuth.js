import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Hook pour accéder au contexte d'authentification
 * Retourne user, token, loginUser, logoutUser, isAuthenticated, hasRole
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  const hasRole = (...roles) => {
    return roles.includes(context.user?.role);
  };

  return {
    ...context,
    hasRole,
    isAuthenticated: !!context.token,
  };
}

export default useAuth;

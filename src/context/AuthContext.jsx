import { createContext, useState, useContext, useEffect } from 'react';
import { getProfil } from '../api/authAPI';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    /* Si c'est un token de démo, charger l'utilisateur depuis le localStorage */
    if (token.startsWith('demo-')) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch (_) { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    /* Sinon, appel API réel */
    getProfil()
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        /* Si l'API échoue, tenter le localStorage en fallback */
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (_) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
        setLoading(false);
      });
  }, [token]);

  const loginUser = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

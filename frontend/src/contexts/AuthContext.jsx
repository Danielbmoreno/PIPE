import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService.js';
import { useToast } from '../components/ui/ToastContext.jsx';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    authService.getSession()
      .then((session) => {
        if (session) {
          setUser(session.usuario);
          setToken(session.token);
        }
      })
      .catch((error) => console.error('Error restaurando sesión Supabase:', error))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  }, []);

  const login = async (correo, password) => {
    if (!correo || !password) {
      throw new Error('Correo y contraseña son requeridos');
    }

    const email = String(correo).trim().toLowerCase();
    if (!email.endsWith('.edu')) {
      throw new Error('Debe ingresar un correo institucional válido');
    }

    const response = await authService.login({ correo: email, password });
    if (!response.success) {
      throw new Error(response.error || 'Error al iniciar sesión');
    }

    const { token: jwtToken, usuario } = response.data;
    if (!jwtToken || !usuario) {
      throw new Error('Respuesta de autenticación inválida');
    }

    saveSession(usuario, jwtToken);
    showToast('Inicio de sesión exitoso', 'success');
    return usuario;
  };

  const logout = useCallback(() => {
    authService.logout()
      .catch((error) => console.error('Error cerrando sesión Supabase:', error))
      .finally(() => {
        setUser(null);
        setToken(null);
        showToast('Sesión cerrada', 'success');
      });
  }, [showToast]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

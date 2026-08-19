import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService.js';
import { useToast } from '../components/ui/ToastContext.jsx';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'pipe_auth';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const storage = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (e) {
        console.warn('Error leyendo sesión local', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userData, token: jwtToken }));
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
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    showToast('Sesión cerrada', 'success');
  }, [showToast]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

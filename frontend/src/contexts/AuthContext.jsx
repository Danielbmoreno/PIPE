import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService.js';
import { isInstitutionalEmail } from '../lib/institutionalEmail.js';
import { resetAccess } from '../services/supabaseService.js';
import { useToast } from '../components/ui/ToastContext.jsx';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    let revision = 0;
    const restore = async () => {
      const current = ++revision;
      try {
        const session = await authService.getSession();
        if (active && current === revision) { setUser(session?.usuario || null); setToken(session?.token || null); }
      } catch { if (active && current === revision) { setUser(null); setToken(null); } }
      finally { if (active) setLoading(false); }
    };
    restore();
    let subscription;
    try { subscription = authService.subscribe(restore).data.subscription; } catch { /* Missing local configuration is shown by login. */ }
    return () => { active = false; revision += 1; subscription?.unsubscribe(); };
  }, []);

  const refreshSession = async () => {
    resetAccess();
    const session = await authService.getSession();
    setUser(session?.usuario || null);
    setToken(session?.token || null);
  };

  const saveSession = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  }, []);

  const login = async (correo, password) => {
    if (!correo || !password) {
      throw new Error('Correo y contraseña son requeridos');
    }

    const email = String(correo).trim().toLowerCase();
    if (!isInstitutionalEmail(email)) {
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
      .then(() => {
        setUser(null);
        setToken(null);
        showToast('Sesión cerrada', 'success');
      }).catch((error) => showToast(error.message || 'No se pudo cerrar la sesión.', 'error'));
  }, [showToast]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
